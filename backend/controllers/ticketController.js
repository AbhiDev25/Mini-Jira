const Ticket = require('../models/Ticket');

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('assignedTo', 'name email');
    res.json(tickets);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.createTicket = async (req, res) => {
  try {
    const newTicket = new Ticket(req.body);
    const ticket = await newTicket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};