import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, prayerRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/prayer-times`)
      ]);
      setStats(statsRes.data);
      setPrayerTimes(prayerRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative bg-cover bg-center h-64 rounded-xl overflow-hidden" 
           style={{backgroundImage: 'url(https://images.unsplash.com/photo-1519818187420-8e49de7adeef)'}}>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">MAKKA MASJID RIPPONPET</h1>
            <p className="text-xl">Management System</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats?.total_members || 0}</div>
            <div className="text-gray-600">Total Members</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats?.committee_members || 0}</div>
            <div className="text-gray-600">Committee Members</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">₹{stats?.monthly_collections || 0}</div>
            <div className="text-gray-600">Monthly Collections</div>
          </div>
        </div>
      </div>

      {/* Prayer Times */}
      {prayerTimes && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Today's Prayer Times</h2>
          <div className="text-sm text-gray-600 mb-4">
            {prayerTimes.date} • {prayerTimes.hijri_date}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Fajr', time: prayerTimes.fajr },
              { name: 'Dhuhr', time: prayerTimes.dhuhr },
              { name: 'Asr', time: prayerTimes.asr },
              { name: 'Maghrib', time: prayerTimes.maghrib },
              { name: 'Isha', time: prayerTimes.isha }
            ].map((prayer) => (
              <div key={prayer.name} className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-700">{prayer.name}</div>
                <div className="text-lg font-bold">{prayer.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {stats?.recent_payments && stats.recent_payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Recent Payments</h2>
          <div className="space-y-3">
            {stats.recent_payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">{payment.member_name}</div>
                  <div className="text-sm text-gray-600">{payment.payment_type.replace('_', ' ').toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">₹{payment.amount}</div>
                  <div className="text-sm text-gray-600">{payment.receipt_number}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Members Management Component
const MembersManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    id_proof_type: 'Aadhar',
    id_proof_number: '',
    is_committee_member: false,
    committee_position: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/members`);
      setMembers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/members`, formData);
      setShowAddForm(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        id_proof_type: 'Aadhar',
        id_proof_number: '',
        is_committee_member: false,
        committee_position: ''
      });
      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Error adding member');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-green-700">Members Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add New Member
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add New Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Email (Optional)"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <textarea
                name="address"
                placeholder="Address *"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows="3"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                name="id_proof_type"
                value={formData.id_proof_type}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Aadhar">Aadhar Card</option>
                <option value="Pan">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
              </select>
              <input
                type="text"
                name="id_proof_number"
                placeholder="ID Proof Number *"
                value={formData.id_proof_number}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_committee_member"
                  checked={formData.is_committee_member}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-green-600"
                />
                <label className="text-gray-700">Committee Member</label>
              </div>
              {formData.is_committee_member && (
                <input
                  type="text"
                  name="committee_position"
                  placeholder="Committee Position"
                  value={formData.committee_position}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-400 text-white p-3 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.account_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.phone}</div>
                    {member.email && <div className="text-sm text-gray-500">{member.email}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.is_committee_member ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {member.committee_position || 'Committee Member'}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Regular Member
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Payments Component
const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_type: 'monthly_chanda',
    transaction_id: '',
    month_year: new Date().toISOString().slice(0, 7) // Current month
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, membersRes] = await Promise.all([
        axios.get(`${API}/payments`),
        axios.get(`${API}/members`)
      ]);
      setPayments(paymentsRes.data);
      setMembers(membersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.member_id || !formData.amount || !formData.payment_type) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/payments`, formData);
      if (response.status === 200) {
        alert(`Payment recorded successfully! Receipt Number: ${response.data.receipt_number}`);
        setShowAddForm(false);
        setFormData({
          member_id: '',
          amount: '',
          payment_type: 'monthly_chanda',
          transaction_id: '',
          month_year: new Date().toISOString().slice(0, 7)
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error processing payment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-green-700">Payments Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Record Payment
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Record New Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                name="member_id"
                value={formData.member_id}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.account_number}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="amount"
                placeholder="Amount (₹)"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="1"
                step="0.01"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                name="payment_type"
                value={formData.payment_type}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="monthly_chanda">Monthly Chanda</option>
                <option value="ramzan_taravi">Ramzan Taravi</option>
                <option value="donation">Donation</option>
              </select>
              {formData.payment_type === 'monthly_chanda' && (
                <input
                  type="month"
                  name="month_year"
                  value={formData.month_year}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
              <input
                type="text"
                name="transaction_id"
                placeholder="UPI Transaction ID (Optional)"
                value={formData.transaction_id}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-400 text-white p-3 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt & Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.receipt_number}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.member_name}</div>
                    <div className="text-sm text-gray-500">{payment.member_account_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.payment_type.replace('_', ' ').toUpperCase()}
                    </div>
                    {payment.month_year && (
                      <div className="text-sm text-gray-500">For: {payment.month_year}</div>
                    )}
                    {payment.transaction_id && (
                      <div className="text-sm text-gray-500">TXN: {payment.transaction_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">₹{payment.amount}</div>
                    <div className="text-sm text-gray-500">{payment.payment_method}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'members', name: 'Members', icon: '👥' },
    { id: 'payments', name: 'Payments', icon: '💰' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <MembersManagement />;
      case 'payments':
        return <PaymentsManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-700">MAKKA MASJID RIPPONPET</h1>
            </div>
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;