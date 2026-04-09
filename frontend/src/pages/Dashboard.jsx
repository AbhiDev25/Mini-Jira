import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useNavigate } from 'react-router-dom';
import { Plus, Bug, X, Search, Trash2, LayoutDashboard, Edit2, FolderPlus, LogOut } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const [tickets, setTickets] = useState([]);
    const [projects, setProjects] = useState([]); 
    const [users, setUsers] = useState([]);
    const [restrictEdit, setRestrictEdit] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterProject, setFilterProject] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'Medium', status: 'Open', project: '', assignedTo: '' });

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectFormData, setProjectFormData] = useState({ name: '', description: '' });

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/users');
            setUsers(res.data);
        } catch (err) { console.error("Failed to fetch users", err); }
    };

    const fetchTickets = async () => {
        try {
            const res = await axios.get('/tickets');
            setTickets(res.data);
        } catch (err) { console.error("Failed to fetch tickets", err); }
    };

    const fetchProjects = async () => {
        try {
            const res = await axios.get('/projects');
            setProjects(res.data);
        } catch (err) { console.error("Failed to fetch projects", err); }
    };

    useEffect(() => {
        fetchTickets();
        fetchProjects();
        fetchUsers();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.patch(`/tickets/${id}`, { status: newStatus });
            fetchTickets();
        } catch (err) { alert("Failed to update status"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ticket?")) return;
        try {
            await axios.delete(`/tickets/${id}`);
            fetchTickets();
        } catch (err) { alert("Failed to delete ticket"); }
    };

    const openEditModal = (ticket) => {
        const isAdmin = currentUser?.role === 'Admin';
        const isCreator = ticket.createdBy === currentUser?.id;

        setRestrictEdit(!isAdmin && !isCreator);

        setEditingId(ticket._id);
        setFormData({
            title: ticket.title,
            description: ticket.description || '',
            priority: ticket.priority,
            status: ticket.status,
            project: ticket.project?._id || '',
            assignedTo: ticket.assignedTo?._id || ''
        });
        setIsModalOpen(true);
    };

    const closeTicketModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ title: '', description: '', priority: 'Medium', status: 'Open', project: '', assignedTo: '' });
    };

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        if (!formData.project) return alert("Please select a project first!"); 

        try {
            if (editingId) {
                const res = await axios.patch(`/tickets/${editingId}`, formData);
                setTickets(tickets.map(t => t._id === editingId ? res.data : t));
            } else {
                const res = await axios.post('/tickets', formData);
                setTickets([res.data, ...tickets]);
            }
            closeTicketModal();
        } catch (err) { alert(editingId ? "Error updating ticket" : "Error creating ticket"); }
    };

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/projects', projectFormData);
            setProjects([res.data, ...projects]); 
            setIsProjectModalOpen(false);
            setProjectFormData({ name: '', description: '' });

            setFormData(prev => ({ ...prev, project: res.data._id }));
        } catch (err) {
            alert("Error creating project");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;

        const matchesProject = filterProject === 'All' || (t.project && t.project._id === filterProject);

        return matchesSearch && matchesPriority && matchesProject;
    });

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            case 'Medium': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
            default: return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'text-slate-500 line-through';
            case 'In Progress': return 'text-blue-600 font-medium';
            default: return 'text-slate-900 font-medium';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

            <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900">
                        <div className="bg-blue-600 p-1.5 rounded-md">
                            <Bug size={20} className="text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">Mini Jira</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">
                            {JSON.parse(localStorage.getItem('user'))?.name || 'User'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Your Workspace</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your projects and track issues.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsProjectModalOpen(true)}
                            className="bg-white border cursor-pointer border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            <FolderPlus size={16} /> New Project
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-900 text-white cursor-pointer px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                        >
                            <Plus size={16} /> Create Issue
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search issues by title..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all cursor-pointer"
                        onChange={(e) => setFilterPriority(e.target.value)}
                    >
                        <option value="All">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <select
                        className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-all cursor-pointer"
                        onChange={(e) => setFilterProject(e.target.value)}
                    >
                        <option value="All">All Projects</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {filteredTickets.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">
                            No issues found. Create a project and a new ticket to get started.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-500">Issue</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Description</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Project</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Assignee</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Priority</th>
                                    <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                                    <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className= "px-6 py-4" >
                                            {ticket.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-normal max-w-xs break-words">
                                            {ticket.description}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {/* We use ?.name just in case you have old test tickets without projects */}
                                            {ticket.project?.name || 'No Project'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                    {ticket.assignedTo ? ticket.assignedTo.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="text-slate-600 font-medium">
                                                    {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium inline-block ${getPriorityStyle(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                                                className="bg-transparent border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 hover:border-slate-300 focus:border-blue-500 outline-none cursor-pointer"
                                            >
                                                <option>Open</option>
                                                <option>In Progress</option>
                                                <option>Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => openEditModal(ticket)} className="text-slate-400 cursor-pointer hover:text-blue-600 p-1 rounded-md transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            {currentUser?.role === 'Admin' && (
                                                <button onClick={() => handleDelete(ticket._id)} className="text-slate-400 cursor-pointer hover:text-red-600 p-1 rounded-md transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
                            <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleProjectSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name</label>
                                <input required autoFocus className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    value={projectFormData.name} onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <textarea className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 min-h-[80px]"
                                    value={projectFormData.description} onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 bg-white border text-slate-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Issue' : 'Create New Issue'}</h2>
                            <button onClick={closeTicketModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Project</label>
                                {projects.length === 0 ? (
                                    <p className="text-sm text-red-500 mb-2 font-medium">You must create a project first!</p>
                                ) : (
                                    <select
                                        required
                                        disabled={restrictEdit}
                                        className="w-full cursor-pointer border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed bg-white"
                                        value={formData.project}
                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                    >
                                        <option value="" disabled>Select a project...</option>
                                        {projects.map(p => (
                                            <option key={p._id} value={p._id} className='cursor-pointer'>{p.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
                                <select
                                    disabled={restrictEdit}
                                    className="w-full border border-slate-200 cursor-pointer rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed bg-white"
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(user => (
                                        <option key={user._id} value={user._id} className='cursor-pointer'>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                                <input required disabled={restrictEdit} placeholder="e.g., Fix navigation bug" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <textarea disabled={restrictEdit} placeholder="Add details..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority Level</label>
                                <select disabled={restrictEdit} className="w-full cursor-pointer border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed bg-white"
                                    value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={closeTicketModal} className="flex-1 bg-white border text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={projects.length === 0}
                                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                    {editingId ? 'Save Changes' : 'Create Issue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;