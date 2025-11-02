import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard({ token, setToken }) {
  const [sweets, setSweets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingSweet, setEditingSweet] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: 'chocolate'
  })
  const [searchName, setSearchName] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    fetchSweets()
  }, [])

  const fetchSweets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sweets')
      setSweets(response.data)
    } catch (err) {
      console.error('Error fetching sweets:', err)
    }
  }

  const handleSearch = async () => {
    try {
      let url = 'http://localhost:5000/api/sweets';
      const params = new URLSearchParams();
      
      if (searchName) params.append('name', searchName);
      if (filterCategory) params.append('category', filterCategory);
      
      if (params.toString()) {
        url = `http://localhost:5000/api/sweets/search?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setSweets(response.data);
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('token')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSweet) {
        await axios.put(
          `http://localhost:5000/api/sweets/${editingSweet._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await axios.post('http://localhost:5000/api/sweets', formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowModal(false)
      setEditingSweet(null)
      setFormData({ name: '', description: '', price: '', quantity: '', category: 'chocolate' })
      fetchSweets()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sweet?')) {
      try {
        await axios.delete(`http://localhost:5000/api/sweets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        fetchSweets()
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed')
      }
    }
  }

  const handlePurchase = async (id, currentQuantity) => {
    const quantity = prompt('Enter quantity to purchase:')
    if (quantity && parseInt(quantity) > 0) {
      try {
        await axios.post(
          `http://localhost:5000/api/sweets/${id}/purchase`,
          { quantity: parseInt(quantity) },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        alert('Purchase successful!')
        fetchSweets()
      } catch (err) {
        alert(err.response?.data?.message || 'Purchase failed')
      }
    }
  }

  const openEditModal = (sweet) => {
    setEditingSweet(sweet)
    setFormData({
      name: sweet.name,
      description: sweet.description,
      price: sweet.price,
      quantity: sweet.quantity,
      category: sweet.category
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingSweet(null)
    setFormData({ name: '', description: '', price: '', quantity: '', category: 'chocolate' })
    setShowModal(true)
  }

  return (
    <div>
      <div className="navbar">
        <h1>Sweet Shop Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={openAddModal} className="btn" style={{ width: 'auto', padding: '8px 20px' }}>
            Add Sweet
          </button>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto', padding: '8px 20px' }}>
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        <h2>Available Sweets</h2>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="form-control"
            style={{ width: '300px' }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="form-control"
            style={{ width: '200px' }}
          >
            <option value="">All Categories</option>
            <option value="chocolate">Chocolate</option>
            <option value="candy">Candy</option>
            <option value="gummy">Gummy</option>
            <option value="lollipop">Lollipop</option>
            <option value="other">Other</option>
          </select>
          <button onClick={handleSearch} className="btn" style={{ width: 'auto', padding: '8px 20px' }}>
            Search
          </button>
          <button onClick={() => { setSearchName(''); setFilterCategory(''); fetchSweets(); }} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 20px' }}>
            Clear
          </button>
        </div>

        <div className="sweets-grid">
          {sweets.map((sweet) => (
            <div key={sweet._id} className="sweet-card">
              <h3>{sweet.name}</h3>
              <p>{sweet.description}</p>
              <p className="price">${sweet.price}</p>
              <p>Category: {sweet.category}</p>
              <p>Stock: {sweet.quantity}</p>
              <div className="actions">
                <button onClick={() => handlePurchase(sweet._id, sweet.quantity)} className="btn">
                  Buy
                </button>
                <button onClick={() => openEditModal(sweet)} className="btn btn-secondary">
                  Edit
                </button>
                <button onClick={() => handleDelete(sweet._id)} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setShowModal(false)}>&times;</span>
              <h2>{editingSweet ? 'Edit Sweet' : 'Add New Sweet'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="chocolate">Chocolate</option>
                    <option value="candy">Candy</option>
                    <option value="gummy">Gummy</option>
                    <option value="lollipop">Lollipop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn">
                  {editingSweet ? 'Update' : 'Create'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
