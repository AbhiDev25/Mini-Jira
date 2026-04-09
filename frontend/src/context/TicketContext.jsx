import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    const res = await axios.get('http://localhost:5000/api/tickets');
    setTickets(res.data);
  };

  return (
    <TicketContext.Provider value={{ tickets, fetchTickets }}>
      {children}
    </TicketContext.Provider>
  );
};