/**
 * Shopping Cart Context
 * Manages cart state, adding/removing items, and cart operations
 */

import { createContext, useContext, useState, useEffect } from 'react'

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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  /**
   * Add item to cart
   * @param {Object} product - Product to add
   * @param {number} quantity - Quantity to add (default: 1)
   */
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id)

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.quantity) }
            : item
        )
      } else {
        // Add new item
        return [...prevItems, { ...product, quantity }]
      }
    })
  }

  /**
   * Remove item from cart
   * @param {number} productId - ID of product to remove
   */
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId))
  }

  /**
   * Update item quantity in cart
   * @param {number} productId - ID of product to update
   * @param {number} quantity - New quantity
   */
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: Math.min(quantity, item.quantity) }
        }
        return item
      })
    )
  }

  /**
   * Clear all items from cart
   */
  const clearCart = () => {
    setCartItems([])
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