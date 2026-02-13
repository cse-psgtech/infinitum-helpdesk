import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import crypto from 'crypto';

interface DeskRoom {
  deskClient: Socket | null;
  scannerClient: Socket | null;
}

const deskRooms = new Map<string, DeskRoom>();
const deskSessions = new Map<string, { signature: string; createdAt: number }>();

// Session validation
export const validateDeskSession = (deskId: string, signature: string): boolean => {
  const session = deskSessions.get(deskId);
  if (!session) return false;
  
  // Session expires after 24 hours
  const isExpired = Date.now() - session.createdAt > 24 * 60 * 60 * 1000;
  if (isExpired) {
    deskSessions.delete(deskId);
    return false;
  }
  
  return session.signature === signature;
};

// Create desk session
export const createDeskSession = (): { deskId: string; signature: string } => {
  const deskId = crypto.randomBytes(16).toString('hex');
  const signature = crypto.randomBytes(32).toString('hex');
  
  deskSessions.set(deskId, {
    signature,
    createdAt: Date.now()
  });
  
  return { deskId, signature };
};

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  if (io) {
    console.log('Socket.IO already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost and local network IPs
        const allowedOrigins = [
          'http://localhost:4000',
          'http://localhost:3000',
          'http://localhost:5173',
          'https://helpdeskinfinitum.psgtech.ac.in',
          'http://helpdeskinfinitum.psgtech.ac.in',
          ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
          /^http:\/\/192\.168\.\d+\.\d+:4000$/,
          /^http:\/\/192\.168\.\d+\.\d+:3000$/,
          /^http:\/\/192\.168\.\d+\.\d+:5173$/,
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

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join desk session as laptop (helpdesk)
    socket.on('join-desk', ({ deskId, signature }: { deskId: string; signature: string }) => {
      console.log(`Desk joining: ${deskId}`);
      
      // Validate session
      if (!validateDeskSession(deskId, signature)) {
        socket.emit('error', { message: 'Invalid or expired desk session' });
        return;
      }

      // Get or create room
      let room = deskRooms.get(deskId);
      if (!room) {
        room = { deskClient: null, scannerClient: null };
        deskRooms.set(deskId, room);
      }

      // Set this socket as desk client
      room.deskClient = socket;
      socket.data.deskId = deskId;
      socket.data.role = 'desk';

      // Notify desk of successful join
      socket.emit('desk-joined', { deskId });

      // If scanner already connected, notify desk
      if (room.scannerClient) {
        socket.emit('scanner-connected');
      }

      console.log(`Desk ${deskId} joined successfully`);
    });

    // Join desk session as phone (scanner)
    socket.on('join-scanner', ({ deskId, signature }: { deskId: string; signature: string }) => {
      console.log(`Scanner joining: ${deskId}`);
      
      // Validate session
      if (!validateDeskSession(deskId, signature)) {
        socket.emit('error', { message: 'Invalid or expired desk session' });
        return;
      }

      // Get room
      const room = deskRooms.get(deskId);
      if (!room) {
        socket.emit('error', { message: 'Desk session not found' });
        return;
      }

      // Set this socket as scanner client
      room.scannerClient = socket;
      socket.data.deskId = deskId;
      socket.data.role = 'scanner';

      // Notify scanner of successful join
      socket.emit('scanner-joined', { deskId });

      // Notify desk that scanner is connected
      if (room.deskClient) {
        room.deskClient.emit('scanner-connected');
      }

      console.log(`Scanner joined desk ${deskId}`);
    });

    // Handle scanned participant ID from phone
    socket.on('scan-participant', ({ uniqueId }: { uniqueId: string }) => {
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

      // Forward to both desk and scanner
      if (room.deskClient) {
        room.deskClient.emit('scan-acknowledged', { uniqueId });
      }
      if (room.scannerClient) {
        room.scannerClient.emit('scan-acknowledged', { uniqueId });
      }

      console.log(`Forwarded scan to desk and scanner in desk ${deskId}`);
    });

    // Handle resume scanning signal from desk
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

    // Handle clear scan
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

    // Handle disconnection
    socket.on('disconnect', () => {
      const deskId = socket.data.deskId;
      const role = socket.data.role;

      console.log(`Client disconnected: ${socket.id} (${role})`);

      if (deskId) {
        const room = deskRooms.get(deskId);
        if (room) {
          if (role === 'desk') {
            room.deskClient = null;
            // Notify scanner if connected
            if (room.scannerClient) {
              room.scannerClient.emit('desk-disconnected');
            }
            // Clean up if both disconnected
            if (!room.scannerClient) {
              deskRooms.delete(deskId);
            }
          } else if (role === 'scanner') {
            room.scannerClient = null;
            // Notify desk if connected
            if (room.deskClient) {
              room.deskClient.emit('scanner-disconnected');
            }
            // Clean up if both disconnected
            if (!room.deskClient) {
              deskRooms.delete(deskId);
            }
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
