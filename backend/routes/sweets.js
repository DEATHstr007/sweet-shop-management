const express = require('express');
const Sweet = require('../models/Sweet');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all sweets
router.get('/', async (req, res) => {
  try {
    const sweets = await Sweet.find().populate('createdBy', 'username email');
    res.json(sweets);
  } catch (error) {
    console.error('Get sweets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search sweets
router.get('/search', async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    
    let query = {};
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    const sweets = await Sweet.find(query).populate('createdBy', 'username email');
    res.json(sweets);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sweet by ID
router.get('/:id', async (req, res) => {
  try {
    const sweet = await Sweet.findById(req.params.id).populate('createdBy', 'username email');
    if (!sweet) {
      return res.status(404).json({ message: 'Sweet not found' });
    }
    res.json(sweet);
  } catch (error) {
    console.error('Get sweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create sweet (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;

    if (!name || !description || price === undefined || quantity === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const sweet = new Sweet({
      name,
      description,
      price,
      quantity,
      category: category || 'other',
      createdBy: req.user.userId
    });

    await sweet.save();
    res.status(201).json({ message: 'Sweet created successfully', sweet });
  } catch (error) {
    console.error('Create sweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update sweet (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;

    const sweet = await Sweet.findById(req.params.id);
    if (!sweet) {
      return res.status(404).json({ message: 'Sweet not found' });
    }

    if (name) sweet.name = name;
    if (description) sweet.description = description;
    if (price !== undefined) sweet.price = price;
    if (quantity !== undefined) sweet.quantity = quantity;
    if (category) sweet.category = category;

    await sweet.save();
    res.json({ message: 'Sweet updated successfully', sweet });
  } catch (error) {
    console.error('Update sweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete sweet (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const sweet = await Sweet.findByIdAndDelete(req.params.id);
    if (!sweet) {
      return res.status(404).json({ message: 'Sweet not found' });
    }
    res.json({ message: 'Sweet deleted successfully' });
  } catch (error) {
    console.error('Delete sweet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Purchase sweet (protected)
router.post('/:id/purchase', auth, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity required' });
    }

    const sweet = await Sweet.findById(req.params.id);
    if (!sweet) {
      return res.status(404).json({ message: 'Sweet not found' });
    }

    if (sweet.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    sweet.quantity -= quantity;
    await sweet.save();

    res.json({ message: 'Purchase successful', sweet });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Restock sweet (protected)
router.post('/:id/restock', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity required' });
    }
    
    const sweet = await Sweet.findById(req.params.id);
    if (!sweet) {
      return res.status(404).json({ message: 'Sweet not found' });
    }
    
    sweet.quantity += parseInt(quantity);
    await sweet.save();
    
    res.json({ message: 'Sweet restocked successfully', sweet });
  } catch (error) {
    console.error('Restock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
