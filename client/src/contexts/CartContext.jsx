/**
 * Shopping Cart Context
 * Manages cart state, adding/removing items, and cart operations
 * Uses database for authenticated users, localStorage for guests
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

const CartContext = createContext()

/**
 * Custom hook to use cart context
 * Must be used within a CartProvider component
 */
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

/**
 * Cart Provider component
 * Wraps the application to provide cart state and methods
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  // Load cart on mount and when auth status changes
  useEffect(() => {
    loadCart()
  }, [isAuthenticated])

  // Save cart whenever it changes (only for unauthenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      saveCart()
    }
  }, [cartItems, isAuthenticated])

  const loadCart = async () => {
    if (isAuthenticated) {
      try {
        const response = await api.get('/cart')
        const mappedItems = response.data.map(item => ({
          id: item.product_id,
          cart_item_id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          available_quantity: item.available_quantity
        }))
        setCartItems(mappedItems)
      } catch (error) {
        console.error('Error loading cart from API:', error)
        setCartItems([])
      }
    } else {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart))
        } catch (error) {
          console.error('Error loading cart from localStorage:', error)
          setCartItems([])
        }
      } else {
        setCartItems([])
      }
    }
  }

  const saveCart = () => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }

  /**
   * Add item to cart
   * @param {Object} product - Product to add
   * @param {number} quantity - Quantity to add (default: 1)
   */
  const addToCart = async (product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        // Find existing cart item to handle backend difference of POST (add) vs PUT (update quantity isn't supported directly in post if it violates limits)
        const existingItem = cartItems.find(item => item.id === product.id)
        if (existingItem) {
          const newQty = Math.min(existingItem.quantity + quantity, product.quantity)
          await api.put(`/cart/${product.id}`, { quantity: newQty })
        } else {
          await api.post('/cart', { product_id: product.id, quantity })
        }
        await loadCart()
      } catch (error) {
        console.error('Error adding to cart:', error)
      }
    } else {
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id)
        if (existingItem) {
          return prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, product.quantity) }
              : item
          )
        } else {
          return [...prevItems, { ...product, quantity }]
        }
      })
    }
  }

  /**
   * Remove item from cart
   * @param {number} productId - ID of product to remove
   */
  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        await api.delete(`/cart/${productId}`)
        await loadCart()
      } catch (error) {
        console.error('Error removing from cart:', error)
      }
    } else {
      setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
    }
  }

  /**
   * Update item quantity in cart
   * @param {number} productId - ID of product to update
   * @param {number} quantity - New quantity
   */
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId)
    }

    if (isAuthenticated) {
      try {
        await api.put(`/cart/${productId}`, { quantity })
        await loadCart()
      } catch (error) {
        console.error('Error updating cart quantity:', error)
      }
    } else {
      setCartItems(prevItems =>
        prevItems.map(item => {
          if (item.id === productId) {
            return { ...item, quantity: Math.min(quantity, item.available_quantity || item.quantity) }
          }
          return item
        })
      )
    }
  }

  /**
   * Clear all items from cart
   */
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart')
        await loadCart()
      } catch (error) {
        console.error('Error clearing cart:', error)
      }
    } else {
      setCartItems([])
    }
  }

  /**
   * Get total number of items in cart
   */
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  /**
   * Get total price of all items in cart
   */
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  /**
   * Check if product is in cart
   * @param {number} productId - ID of product to check
   */
  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId)
  }

  /**
   * Get quantity of specific product in cart
   * @param {number} productId - ID of product
   */
  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  // Context value object containing cart state and methods
  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInCart,
    getItemQuantity
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}