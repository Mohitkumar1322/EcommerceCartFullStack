import React, { useContext, useState } from 'react';
import Title from '../component/Title';
import CartTotal from '../component/CartTotal';
import { shopDataContext } from '../context/ShopContext';
import { authDataContext } from '../context/authContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loading from '../component/Loading';

function PlaceOrder() {
  const navigate = useNavigate();
  const { cartItem, setCartItem, getCartAmount, delivery_fee, products } = useContext(shopDataContext);
  const { serverUrl } = useContext(authDataContext);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    country: '',
    phone: ''
  });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Order Payment',
      description: 'Order Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(serverUrl + '/api/order/verifyrazorpay', response, { withCredentials: true });
          if (data) {
            setCartItem({});
            toast.success("Payment Successful");
            navigate("/order");
          }
        } catch (err) {
          console.error(err);
          toast.error("Payment verification failed");
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let orderItems = [];
      for (const items in cartItem) {
        for (const item in cartItem[items]) {
          if (cartItem[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items));
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItem[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee
      };

      const resultRazorpay = await axios.post(serverUrl + "/api/order/razorpay", orderData, { withCredentials: true });
      if (resultRazorpay.data) {
        initPay(resultRazorpay.data);
      } else {
        toast.error("Failed to create Razorpay order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-[100vw] min-h-[100vh] bg-gradient-to-l from-[#141414] to-[#0c2025] flex items-center justify-center flex-col md:flex-row gap-[50px] relative'>
      
      <div className='lg:w-[50%] w-[100%] h-[100%] flex items-center justify-center lg:mt-[0px] mt-[90px]'>
        <form onSubmit={onSubmitHandler} className='lg:w-[70%] w-[95%] lg:h-[70%] h-[100%]'>
          <div className='py-[10px]'>
            <Title text1={'DELIVERY'} text2={'INFORMATION'} />
          </div>

          {/* Delivery Form Fields */}
          {Object.keys(formData).map((key) => (
            <div key={key} className='w-[100%] h-[70px] flex items-center justify-between px-[10px]'>
              <input
                type={key === 'email' ? 'email' : 'text'}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                name={key}
                value={formData[key]}
                onChange={onChangeHandler}
                required
                className='w-[100%] h-[50px] rounded-md bg-slate-700 placeholder:text-white text-[18px] px-[20px] shadow-sm shadow-[#343434]'
              />
            </div>
          ))}

          <div>
            <button type='submit' className='text-[18px] active:bg-slate-500 cursor-pointer bg-[#3bcee848] py-[10px] px-[50px] rounded-2xl text-white flex items-center justify-center gap-[20px] absolute lg:right-[20%] bottom-[10%] right-[35%] border-[1px] border-[#80808049]'>
              {loading ? <Loading /> : "PLACE ORDER"}
            </button>
          </div>
        </form>
      </div>

      <div className='lg:w-[50%] w-[100%] min-h-[100%] flex items-center justify-center gap-[30px]'>
        <div className='lg:w-[70%] w-[90%] lg:h-[70%] h-[100%] flex items-center justify-center gap-[10px] flex-col'>
          <CartTotal />
          <div className='py-[10px]'>
            <Title text1={'PAYMENT'} text2={'METHOD'} />
          </div>
          <div className='w-[100%] h-[30vh] lg:h-[100px] flex items-start mt-[20px] lg:mt-[0px] justify-center gap-[50px]'>
            <p className='text-white text-[18px] font-bold'>Razorpay (Default)</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default PlaceOrder;
