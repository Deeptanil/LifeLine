import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type DispatchType = 'medicine' | 'ambulance' | 'medic' | 'doctor' | 'tele_medic' | 'appointment';

export interface ChatMessage {
  id: string;
  text: string;
  isSender: boolean;
  time: string;
}

export interface DispatchItem {
  id: string;
  type: DispatchType;
  stage: number; 
  title: string;
  subtitle: string;
  icon: string;
  data: any; 
  timerStart?: number; 
  chat?: ChatMessage[];
  chatMode?: 'chat' | 'call';
  isRatingStar?: boolean;
}

export interface IotLog {
  id: string;
  emoji: string;
  text: string;
  time: string;
  dotColor: string;
}

interface DispatchContextProps {
  dispatches: DispatchItem[];
  iotOnline: boolean;
  setIotOnline: (online: boolean) => void;
  iotLogs: IotLog[];
  addIotLog: (emoji: string, text: string, dotColor: string) => void;
  clearIotLogs: () => void;
  startDispatch: (payload: Omit<DispatchItem, 'id' | 'stage'>) => void;
  updateDispatchStage: (id: string, stage: number) => void;
  cancelDispatch: (id: string) => void;
  addChatMessage: (dispatchId: string, text: string, isSender: boolean) => void;
  finishDoctorConsultation: (id: string) => void;
}

const DispatchContext = createContext<DispatchContextProps>({
  dispatches: [],
  iotOnline: false,
  setIotOnline: () => {},
  iotLogs: [],
  addIotLog: () => {},
  clearIotLogs: () => {},
  startDispatch: () => {},
  updateDispatchStage: () => {},
  cancelDispatch: () => {},
  addChatMessage: () => {},
  finishDoctorConsultation: () => {},
});

export const DispatchProvider = ({ children }: { children: React.ReactNode }) => {
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [iotOnline, setIotOnline] = useState(false);
  const [iotLogs, setIotLogs] = useState<IotLog[]>([
    {
      id: "init_1",
      emoji: "🟢",
      text: "IoT System Initialized",
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      dotColor: "#00C9A7",
    }
  ]);
  const timeoutsArray = useRef<{ id: ReturnType<typeof setTimeout>, dispatchId: string }[]>([]);

  const updateDispatchStage = (id: string, stage: number) => {
    setDispatches(prev => prev.map(d => d.id === id ? { ...d, stage } : d));
  };

  useEffect(() => {
    if (dispatches.length === 0) return;

    const interval = setInterval(() => {
      setDispatches(prev => {
        let hasChanges = false;
        
        const mapped = prev.map(d => {
           if (d.type === 'ambulance' || d.type === 'medic') {
              if (d.stage === 0) {
                 const now = Date.now();
                 if (now - (d.timerStart || now) > 8000) {
                    hasChanges = true;
                    return { ...d, stage: 1 };
                 }
              }
              if (d.stage === 1) {
                 const now = Date.now();
                 if (now - (d.timerStart || now) > 600000) {
                    hasChanges = true;
                    return { ...d, stage: 2 };
                 }
              }
           }
          if (d.type === 'medicine') {
             // Stage 0 → 1 (Packing → Out for Delivery): 3 minutes
             if (d.stage === 0) {
                const now = Date.now();
                if (now - (d.timerStart || now) > 8000) {
                   hasChanges = true;
                   return { ...d, stage: 1 };
                }
             }
             // Stage 1 → 2 (Delivered): 10 minutes from order start
             if (d.stage === 1) {
                const now = Date.now();
                if (now - (d.timerStart || now) > 600000) {
                   hasChanges = true;
                   return { ...d, stage: 2 };
                }
             }
          }
          if (d.type === 'doctor' && d.stage === 0) {
             const now = Date.now();
             if (now - (d.timerStart || now) > 6000) {
                hasChanges = true;
                return { 
                  ...d, 
                  stage: 1, 
                  title: 'Connected', 
                  subtitle: d.chatMode === 'chat' ? 'Doctor is online' : 'On Live Call'
                };
             }
          }
          if (d.type === 'doctor' && d.stage === 1) {
             const now = Date.now();
             if (now - (d.timerStart || now) > 300000) { 
                hasChanges = true;
                return { ...d, stage: 2, isRatingStar: true }; 
             }
          }
          if (d.type === 'doctor' && d.stage === 2 && d.isRatingStar) {
             const now = Date.now();
             if (now - (d.timerStart || now) > 420000) { 
                hasChanges = true;
                setTimeout(() => cancelDispatch(d.id), 0);
             }
          }
          return d;
        });

        mapped.forEach(d => {
           // Only auto-cancel ambulance/medic after arrived — medicine stays until user closes
           if ((d.type === 'ambulance' || d.type === 'medic') && d.stage === 2) {
              const check = timeoutsArray.current.find(t => t.dispatchId === d.id);
              if (!check) {
                 const t = setTimeout(() => {
                    cancelDispatch(d.id);
                 }, 30000); // 30s to allow rating
                 timeoutsArray.current.push({ id: t, dispatchId: d.id });
              }
           }
        });

        return hasChanges ? mapped : prev;
      });
    }, 1000); 

    return () => clearInterval(interval);
  }, [dispatches.length]);

  const startDispatch = (payload: Omit<DispatchItem, 'id' | 'stage'>) => {
    const newItem: DispatchItem = {
      ...payload,
      id: Math.random().toString(36).substring(7).toUpperCase(),
      stage: 0,
      timerStart: Date.now()
    };
    
    setDispatches(prev => {
      const filtered = prev.filter(d => d.type !== newItem.type);
      return [...filtered, newItem];
    });
  };

  const cancelDispatch = (id: string) => {
    setDispatches(prev => prev.filter(d => d.id !== id));
  };

  const finishDoctorConsultation = (id: string) => {
    setDispatches(prev => prev.map(d => {
       if (d.id === id) {
          return { ...d, stage: 2, isRatingStar: true };
       }
       return d;
    }));
  };

  const addChatMessage = (dispatchId: string, text: string, isSender: boolean) => {
    setDispatches(prev => prev.map(d => {
      if (d.id === dispatchId) {
         const newChat = [...(d.chat || [])];
         newChat.push({
            id: Math.random().toString(36).substr(2, 9),
            text,
            isSender,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         });
         return { ...d, chat: newChat };
      }
      return d;
    }));
  };

  const addIotLog = (emoji: string, text: string, dotColor: string) => {
    const newLog: IotLog = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      emoji,
      text,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      dotColor,
    };
    setIotLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  const clearIotLogs = () => setIotLogs([]);

  return (
    <DispatchContext.Provider value={{ 
      dispatches, 
      iotOnline, 
      setIotOnline, 
      iotLogs, 
      addIotLog, 
      clearIotLogs,
      startDispatch, 
      updateDispatchStage, 
      cancelDispatch, 
      addChatMessage, 
      finishDoctorConsultation 
    }}>
      {children}
    </DispatchContext.Provider>
  );
};

export const useDispatch = () => useContext(DispatchContext);
