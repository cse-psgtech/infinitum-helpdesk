const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const crypto = require('crypto');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '4000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Desk session management
const deskSessions = new Map();
const deskRooms = new Map();

const validateDeskSession = (deskId, signature) => {
  const session = deskSessions.get(deskId);
  if (!session) return false;
  
  const isExpired = Date.now() - session.createdAt > 24 * 60 * 60 * 1000;
  if (isExpired) {
    deskSessions.delete(deskId);
    return false;
  }
  
  return session.signature === signature;
};

// Make createDeskSession available globally for API route
global.createDeskSession = () => {
  const deskId = crypto.randomBytes(16).toString('hex');
  const signature = crypto.randomBytes(32).toString('hex');
  
  deskSessions.set(deskId, {
    signature,
    createdAt: Date.now()
  });
  
  return { deskId, signature };
};

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          'http://localhost:4000',
          'http://localhost:3000',
          'http://localhost:5173',
          /^http:\/\/192\.168\.\d+\.\d+:4000$/,
          /^http:\/\/192\.168\.\d+\.\d+:3000$/,
          /^http:\/\/10\.\d+\.\d+\.\d+:4000$/,
          /^http:\/\/172\.\d+\.\d+\.\d+:4000$/,
        ];
        
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          if (typeof allowedOrigin === 'string') {
            return allowedOrigin === origin;
          } else {
            return allowedOrigin.test(origin);
          }
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-desk', ({ deskId, signature }) => {
      console.log(`Desk joining: ${deskId}`);
      
      if (!validateDeskSession(deskId, signature)) {
        socket.emit('error', { message: 'Invalid or expired desk session' });
        return;
      }

      let room = deskRooms.get(deskId);
      if (!room) {
        room = { deskClient: null, scannerClient: null };
        deskRooms.set(deskId, room);
      }

      room.deskClient = socket;
      socket.data.deskId = deskId;
      socket.data.role = 'desk';

      socket.emit('desk-joined', { deskId });

      if (room.scannerClient) {
        socket.emit('scanner-connected');
      }

      console.log(`Desk ${deskId} joined successfully`);
    });

    socket.on('join-scanner', ({ deskId, signature }) => {
      console.log(`Scanner joining: ${deskId}`);
      
      if (!validateDeskSession(deskId, signature)) {
        socket.emit('error', { message: 'Invalid or expired desk session' });
        return;
      }

      const room = deskRooms.get(deskId);
      if (!room) {
        socket.emit('error', { message: 'Desk session not found' });
        return;
      }

      room.scannerClient = socket;
      socket.data.deskId = deskId;
      socket.data.role = 'scanner';

      socket.emit('scanner-joined', { deskId });

      if (room.deskClient) {
        room.deskClient.emit('scanner-connected');
      }

      console.log(`Scanner joined desk ${deskId}`);
    });

    socket.on('scan-participant', ({ uniqueId }) => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      if (role !== 'scanner') {
        socket.emit('error', { message: 'Only scanner can send scans' });
        return;
      }

      const room = deskRooms.get(deskId);
      if (!room) {
        socket.emit('error', { message: 'Desk not connected' });
        return;
      }

      if (room.deskClient) {
        room.deskClient.emit('scan-acknowledged', { uniqueId });
      }
      if (room.scannerClient) {
        room.scannerClient.emit('scan-acknowledged', { uniqueId });
      }

      console.log(`Forwarded scan to desk and scanner in desk ${deskId}`);
    });

    socket.on('resume-scanning', () => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      if (role !== 'desk') {
        socket.emit('error', { message: 'Only desk can resume scanning' });
        return;
      }

      const room = deskRooms.get(deskId);
      if (!room || !room.scannerClient) {
        socket.emit('error', { message: 'Scanner not connected' });
        return;
      }

      room.scannerClient.emit('resume-scanning');
      console.log(`Forwarded resume-scanning signal to scanner in desk ${deskId}`);
    });

    socket.on('clear-scan', () => {
      const deskId = socket.data.deskId;
      const room = deskRooms.get(deskId);
      if (!room) {
        socket.emit('error', { message: 'Desk session not found' });
        return;
      }

      if (room.deskClient) {
        room.deskClient.emit('clear-scan');
      }
      if (room.scannerClient) {
        room.scannerClient.emit('clear-scan');
      }

      console.log(`Forwarded clear-scan to desk and scanner in desk ${deskId}`);
    });

    socket.on('disconnect', () => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      console.log(`Client disconnected: ${socket.id} (${role})`);

      if (deskId) {
        const room = deskRooms.get(deskId);
        if (room) {
          if (role === 'desk') {
            room.deskClient = null;
            if (room.scannerClient) {
              room.scannerClient.emit('desk-disconnected');
            }
            if (!room.scannerClient) {
              deskRooms.delete(deskId);
            }
          } else if (role === 'scanner') {
            room.scannerClient = null;
            if (room.deskClient) {
              room.deskClient.emit('scanner-disconnected');
            }
            if (!room.deskClient) {
              deskRooms.delete(deskId);
            }
          }
        }
      }
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO initialized on ws://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});
