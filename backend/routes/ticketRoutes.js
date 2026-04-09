const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth'); 

router.use(auth);

router.get('/', async (req, res) => {
  try {

    let query = {}; 

    if (req.user.role !== 'Admin') {
      query = {
        $or: [
          { createdBy: req.user.id },
          { assignedTo: req.user.id }
        ]
      };
    }

    const tickets = await Ticket.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.body.assignedTo === "") delete req.body.assignedTo;
    const ticketData = { ...req.body, createdBy: req.user.id };
    const newTicket = new Ticket(ticketData);
    await newTicket.save();
    
    await newTicket.populate('project', 'name'); 
    await newTicket.populate('assignedTo', 'name');

    
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    const isAdmin = req.user.role === 'Admin';
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isAssignee = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: "Access denied." });
    }

    let updates = { ...req.body };
    if (updates.assignedTo === "") updates.assignedTo = null;

    if (isAssignee && !isAdmin && !isCreator) {
      updates = { status: req.body.status };
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('project', 'name')
      .populate('assignedTo', 'name');

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);
    if (!deletedTicket) return res.status(404).json({ message: "Ticket not found." });

    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;