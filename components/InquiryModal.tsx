
import React, { useState } from 'react';
import type { Property } from '../types';

interface InquiryModalProps {
  property: Property;
  onClose: () => void;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ property, onClose }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  const handlePayment = () => {
    // NOTE: This function simulates a Razorpay payment flow.
    // In a real application, you would first call your backend to create a Razorpay order.
    // The backend would return an order_id.
    console.log("Initiating payment...");
    
    // The Razorpay checkout options object.
    const options = {
      key: "YOUR_LIVE_API_KEY", // Replace with your actual Razorpay Key ID
      amount: "100", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: "INR",
      name: "Sonipat Home Service",
      description: `Token for ${property.title}`,
      image: "https://picsum.photos/seed/logo/100/100",
      handler: function (response: any) {
        // This function is called after the payment is successful.
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
        // Here you would send the payment details and form data to your backend
        // to verify the payment and save the inquiry to Google Sheets.
        const inquiryData = { name, mobile, email, address, landmark, pincode, propertyId: property.id, paymentId: response.razorpay_payment_id };
        console.log('Inquiry Data with Payment:', inquiryData);
        onClose();
      },
      prefill: {
        name: name,
        email: email,
        contact: mobile,
      },
      notes: {
        address: `${address}, ${landmark}, ${pincode}`,
      },
      theme: {
        color: "#3399cc",
      },
    };
    
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !mobile || !email || !address || !pincode) {
        alert("Please fill all required fields.");
        return;
    }
    // Instead of directly submitting, we now initiate payment.
    // The actual data submission happens in the Razorpay handler.
    handlePayment();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Inquiry for: {property.title}</h2>
          {property.address && <p className="text-sm text-gray-500">{property.address}</p>}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-center bg-blue-50 text-blue-700 p-3 rounded-md">
            Please fill out your details to proceed with the booking. A small token amount will be charged.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required maxLength={10} pattern="\d{10}" className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Email ID</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Full Address</label>
             <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Landmark</label>
                <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Pin Code</label>
                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} required maxLength={6} pattern="\d{6}" className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
             </div>
           </div>
          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700">Proceed to Pay</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryModal;