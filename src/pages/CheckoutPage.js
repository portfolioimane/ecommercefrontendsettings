import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import { addOrder } from '../redux/orderSlice';
import { clearCart } from '../redux/cartSlice';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import './CheckoutPage.css';
import { FaCreditCard, FaPaypal, FaTruck } from 'react-icons/fa';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({
  totalPrice,
  itemsToDisplay,
  paymentMethod,
  setPaymentMethod,
  loading,
  setLoading,
  userEmail,
  orderData,
  isCouponApplied, // Add this line
  discount, // Add this line
  shippingAreas, // Pass shipping areas to CheckoutForm
  setSelectedShippingArea,
    selectedShippingArea // Add this prop
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
 console.log('discount', discount);
  console.log('applied coupon', isCouponApplied);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const updatedOrderData = {
      ...orderData,
      name: event.target.name.value,
      phone: event.target.phone.value,
      address: event.target.address.value,
    };

    try {
      if (paymentMethod === 'credit-card') {
        const { data: paymentResponse } = await axios.post('/api/payment', { total_price: totalPrice });

        const result = await stripe.confirmCardPayment(paymentResponse.paymentIntent.client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

        if (result.error) {
          console.error(result.error.message);
          setLoading(false);
          return;
        }

        const { data: orderResponse } = await axios.post('/api/orders', {
          ...updatedOrderData,
          payment_method: 'credit card',
          payment_status: 'paid',
          discount: isCouponApplied ? discount : 0, // Save discount
          shipping_area_id: selectedShippingArea ? selectedShippingArea.id : null, // Add this line

        });

        dispatch(addOrder(orderResponse.order));
        dispatch(clearCart());
        localStorage.setItem('recentOrder', JSON.stringify(orderResponse.order));
              localStorage.removeItem('appliedCoupon');
               localStorage.removeItem('selectedShippingArea');
        navigate(`/thank-you/order/${orderResponse.order.id}`);
      } else if (paymentMethod === 'cash-on-delivery') {
        const { data: orderResponse } = await axios.post('/api/orders', {
          ...updatedOrderData,
          payment_method: 'cash on delivery',
          payment_status: 'pending',
          discount: isCouponApplied ? discount : 0, // Save discount
            shipping_area_id: selectedShippingArea ? selectedShippingArea.id : null, // Add this line
        });

        dispatch(addOrder(orderResponse.order));
        dispatch(clearCart());
        localStorage.setItem('recentOrder', JSON.stringify(orderResponse.order));
              localStorage.removeItem('appliedCoupon');
              localStorage.removeItem('selectedShippingArea');

        navigate(`/thank-you/order/${orderResponse.order.id}`);
      }
    } catch (error) {
      console.error('Error processing order:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input type="text" id="name" required />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" value={userEmail} readOnly />
      </div>
      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input type="tel" id="phone" required />
      </div>
      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input type="text" id="address" required />
      </div>

      <h4>Payment Method</h4>
      <div className="payment-methods">
        <div className="payment-option">
          <input
            type="radio"
            id="credit-card"
            name="payment"
            value="credit-card"
            required
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <label htmlFor="credit-card">
            <FaCreditCard className="payment-icon" /> Credit Card
          </label>
          {paymentMethod === 'credit-card' && <CardElement />}
        </div>
        <div className="payment-option">
          <input
            type="radio"
            id="paypal"
            name="payment"
            value="paypal"
            required
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <label htmlFor="paypal">
            <FaPaypal className="payment-icon" /> PayPal
          </label>
          {paymentMethod === 'paypal' && (
            <PayPalButtons
              style={{ layout: 'horizontal' }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: totalPrice,
                      },
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                const details = await actions.order.capture();
                const updatedOrderData = {
                  ...orderData,
                  name: document.getElementById('name').value,
                  phone: document.getElementById('phone').value,
                  address: document.getElementById('address').value,
                };
                const { data: orderResponse } = await axios.post('/api/orders', {
                  ...updatedOrderData,
                  payment_status: 'paid',
                  payment_method: 'paypal',
                  discount: isCouponApplied ? discount : 0, // Save discount
                  shipping_area_id: selectedShippingArea ? selectedShippingArea.id : null, // Add this line

                  paypal_details: details,
                });

                dispatch(addOrder(orderResponse.order));
                dispatch(clearCart());
                localStorage.setItem('recentOrder', JSON.stringify(orderResponse.order));
                      localStorage.removeItem('appliedCoupon');
                                     localStorage.removeItem('selectedShippingArea');

                navigate(`/thank-you/order/${orderResponse.order.id}`);
              }}
            />
          )}
        </div>
        <div className="payment-option">
          <input
            type="radio"
            id="cash-on-delivery"
            name="payment"
            value="cash-on-delivery"
            required
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <label htmlFor="cash-on-delivery">
            <FaTruck className="payment-icon" /> Cash on Delivery
          </label>
        </div>
      </div>

      {paymentMethod !== 'paypal' && (
        <button type="submit" className="order-button" disabled={loading}>
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      )}
    </form>
  );
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items || []);
  const guestItems = useSelector((state) => state.cart.guestItems || []);
  const isLoggedIn = useSelector((state) => !!state.auth.token);
  const userEmail = useSelector((state) => state.auth.user?.email);

  const itemsToDisplay = isLoggedIn ? cartItems : guestItems;
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

    const [selectedShippingArea, setSelectedShippingArea] = useState(null);
const [shippingCost, setShippingCost] = useState(0);
const [shippingAreas, setShippingAreas] = useState([]);

  const totalPriceBeforeDiscount = itemsToDisplay
    .reduce((total, item) => total + Number(item.price) * item.quantity, 0)
    .toFixed(2);

const totalPriceShipping = (parseFloat(totalPriceBeforeDiscount) + parseFloat(shippingCost)).toFixed(2);
const totalPrice = (totalPriceBeforeDiscount - discount + parseFloat(shippingCost)).toFixed(2);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [loading, setLoading] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false); 



useEffect(() => {
  const fetchShippingAreas = async () => {
    try {
      const response = await axios.get('/api/admin/shipping-areas');
      setShippingAreas(response.data);
    } catch (error) {
      console.error('Error fetching shipping areas:', error);
    }
  };

  fetchShippingAreas();
}, []);



  useEffect(() => {
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      const { couponCode, discountAmount } = JSON.parse(savedCoupon);
      setCouponCode(couponCode);
      setDiscount(discountAmount);
      setIsCouponApplied(true);
    }
  const savedShippingArea = localStorage.getItem('selectedShippingArea');
  if (savedShippingArea) {
    const area = JSON.parse(savedShippingArea);
    setSelectedShippingArea(area);
    setShippingCost(area.shipping_cost); // Set shipping cost after refresh
  }
  }, []);

const orderData = {
  email: userEmail,
  total_price: totalPrice,
  items: itemsToDisplay.map((item) => ({
    product_id: item.product_id,
    product_variant_id: item.product_variant_id ? item.product_variant_id : null,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
    ...(item.product_variant && {
      variant_details: {
        color: item.product_variant.color,
        size: item.product_variant.size,
      },
    }),
  })),
};

  console.log('orderData', orderData);

const handleApplyCoupon = async () => {
  try {
    const response = await axios.post('/api/coupons/apply', { coupon_code: couponCode });
    const { discount, discount_type } = response.data;

    let discountAmount;
    if (discount_type === 'percentage') {
      discountAmount = (totalPriceBeforeDiscount * (discount / 100)).toFixed(2);
    } else {
      discountAmount = discount;
    }

    setDiscount(discountAmount);
    setIsCouponApplied(true);

    // Save coupon and discount to localStorage
    localStorage.setItem('appliedCoupon', JSON.stringify({
      couponCode,
      discountAmount,
      discount_type,
    }));

    alert('Coupon applied successfully');
  } catch (error) {
    alert(error.response?.data.message || 'An error occurred while applying the coupon');
    setIsCouponApplied(false);
  }
};


  return (
    <Elements stripe={stripePromise}>
      <PayPalScriptProvider options={{ 'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID }}>
        <div className="checkout-container">
          <h2>Checkout</h2>
          <div className="checkout-content">

            <div className="checkout-form">
              <h3>Billing Information</h3>
             <CheckoutForm
                totalPrice={totalPrice}
                itemsToDisplay={itemsToDisplay}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                loading={loading}
                setLoading={setLoading}
                userEmail={userEmail}
                orderData={orderData}
                isCouponApplied={isCouponApplied} // Pass this
                discount={discount} // Pass this
                 shippingAreas={shippingAreas} // Pass shipping areas to CheckoutForm
                setSelectedShippingArea={setSelectedShippingArea} 
                selectedShippingArea={selectedShippingArea}
              />
            </div>

<div className="cart-summary">
  <h3 className="cart-summary-title">Cart Summary</h3>
  <ul className="cart-item-list">
    {itemsToDisplay.map((item) => (
      <li key={item.id} className="cart-item">
        <img
          src={`${process.env.REACT_APP_API_URL}/storage/${item.image}`}
          alt={isLoggedIn ? item.product.name : item.name}
          className="item-image"
        />
        <div className="item-details">
          <p className="item-name">{isLoggedIn ? item.product.name : item.name}</p>
          {item.product_variant && (
            <p className="item-variant">
              <strong>Color:</strong>
              <span
                className="color-circle"
                style={{ backgroundColor: item.product_variant.color }}
                title={item.product_variant.color}
              ></span>
              <strong>Size:</strong> {item.product_variant.size}
            </p>
          )}
          <p className="item-quantity">Quantity: {item.quantity}</p>
          <p className="item-price">{Number(item.price).toFixed(2)} MAD</p>
        </div>
      </li>
    ))}
  </ul>
  <div className="summary-total">
    <span>Total: </span>
    <span>{totalPriceBeforeDiscount} MAD</span>
  </div>
{shippingAreas.length > 0 && (
    <div className="form-group">
  <label htmlFor="shipping-area">Shipping Area</label>
  <select
    id="shipping-area"
    value={selectedShippingArea ? selectedShippingArea.id : ''}
    required
    onChange={(e) => {
      const selectedArea = shippingAreas.find(area => area.id === Number(e.target.value));
      setSelectedShippingArea(selectedArea);
      setShippingCost(selectedArea ? selectedArea.shipping_cost : 0);
      localStorage.setItem('selectedShippingArea', JSON.stringify(selectedArea));

    }}
  >
    <option value="">Select a shipping area</option>
    {shippingAreas.map(area => (
      <option key={area.id} value={area.id}>
        {area.name} - {area.shipping_cost} MAD
      </option>
    ))}
  </select>
</div>
)}
  <div className="summary-final-total">
        <span>Total Price with shipping: </span>
        <span>{totalPriceShipping} MAD</span>
      </div>

  
  {isCouponApplied && (
    <>
      <div className="summary-discount">
        <span>Discount: </span>
        <span>{discount} MAD</span>
      </div>
      <div className="summary-final-total">
        <span>Final Total: </span>
        <span>{totalPrice} MAD</span>
      </div>
    </>
  )}

  <div className="coupon-section">
    <input
      type="text"
      value={couponCode}
      onChange={(e) => setCouponCode(e.target.value)}
      placeholder="Enter coupon code"
      className="coupon-input"
    />
    <button type="button" onClick={handleApplyCoupon} className="coupon-button">
      Apply Coupon
    </button>
  </div>
</div>





          </div>
        </div>
      </PayPalScriptProvider>
    </Elements>
  );
};

export default CheckoutPage;
