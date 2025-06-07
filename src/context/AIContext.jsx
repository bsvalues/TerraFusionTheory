import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AIContext = createContext();

const initialState = {
  operations: [],
  systemStatus: {
    processing: { state: 'optimal', value: 0 },
    memory: { state: 'optimal', value: 0 },
    network: { state: 'optimal', value: 0 }
  },
  performance: {
    accuracy: 0,
    speed: 0,
    efficiency: 0
  },
  userDecisions: [],
  feedback: [],
  isProcessing: false,
  selectedOperation: null
};

function aiReducer(state, action) {
  switch (action.type) {
    case 'START_OPERATION':
      return {
        ...state,
        operations: [...state.operations, {
          id: Date.now(),
          ...action.payload,
          status: 'running',
          progress: 0,
          startTime: new Date()
        }],
        isProcessing: true
      };

    case 'UPDATE_OPERATION':
      return {
        ...state,
        operations: state.operations.map(op =>
          op.id === action.payload.id
            ? { ...op, ...action.payload }
            : op
        )
      };

    case 'COMPLETE_OPERATION':
      return {
        ...state,
        operations: state.operations.map(op =>
          op.id === action.payload.id
            ? { ...op, status: 'completed', progress: 100 }
            : op
        ),
        isProcessing: state.operations.some(op => 
          op.id !== action.payload.id && op.status === 'running'
        )
      };

    case 'UPDATE_SYSTEM_STATUS':
      return {
        ...state,
        systemStatus: {
          ...state.systemStatus,
          [action.payload.metric]: {
            state: action.payload.state,
            value: action.payload.value
          }
        }
      };

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performance: {
          ...state.performance,
          [action.payload.metric]: action.payload.value
        }
      };

    case 'ADD_USER_DECISION':
      return {
        ...state,
        userDecisions: [...state.userDecisions, {
          id: Date.now(),
          ...action.payload,
          timestamp: new Date()
        }]
      };

    case 'ADD_FEEDBACK':
      return {
        ...state,
        feedback: [...state.feedback, {
          id: Date.now(),
          ...action.payload,
          timestamp: new Date()
        }]
      };

    case 'SELECT_OPERATION':
      return {
        ...state,
        selectedOperation: action.payload
      };

    default:
      return state;
  }
}

export function AIProvider({ children }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Simulate system status updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update processing load
      dispatch({
        type: 'UPDATE_SYSTEM_STATUS',
        payload: {
          metric: 'processing',
          state: Math.random() > 0.8 ? 'warning' : 'optimal',
          value: Math.floor(Math.random() * 100)
        }
      });

      // Update memory usage
      dispatch({
        type: 'UPDATE_SYSTEM_STATUS',
        payload: {
          metric: 'memory',
          state: Math.random() > 0.9 ? 'critical' : 'optimal',
          value: Math.floor(Math.random() * 100)
        }
      });

      // Update network latency
      dispatch({
        type: 'UPDATE_SYSTEM_STATUS',
        payload: {
          metric: 'network',
          state: Math.random() > 0.7 ? 'warning' : 'optimal',
          value: Math.floor(Math.random() * 200)
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulate operation progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      state.operations
        .filter(op => op.status === 'running')
        .forEach(op => {
          const progress = Math.min(op.progress + Math.random() * 10, 100);
          dispatch({
            type: 'UPDATE_OPERATION',
            payload: {
              id: op.id,
              progress
            }
          });

          if (progress >= 100) {
            dispatch({
              type: 'COMPLETE_OPERATION',
              payload: { id: op.id }
            });
          }
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.operations]);

  const value = {
    state,
    dispatch,
    startOperation: (operation) => {
      dispatch({ type: 'START_OPERATION', payload: operation });
    },
    updateOperation: (id, updates) => {
      dispatch({ type: 'UPDATE_OPERATION', payload: { id, ...updates } });
    },
    completeOperation: (id) => {
      dispatch({ type: 'COMPLETE_OPERATION', payload: { id } });
    },
    addUserDecision: (decision) => {
      dispatch({ type: 'ADD_USER_DECISION', payload: decision });
    },
    addFeedback: (feedback) => {
      dispatch({ type: 'ADD_FEEDBACK', payload: feedback });
    },
    selectOperation: (operation) => {
      dispatch({ type: 'SELECT_OPERATION', payload: operation });
    }
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
} 