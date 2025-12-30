import React, { useState } from "react";
import axios from "axios";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";

const BookingModal = ({ concert, onClose }) => {
  const [step, setStep] = useState(1);
  const [bookingId, setBookingId] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [error, setError] = useState("");

  const handleBooking = () => {
    setStep(2);
    setError("");

    bookingService
      .createBooking(concert.id, 1)
      .then((response) => {
        const booking = response.booking || response;
        setBookingId(booking.bookingId);
        setTotalPrice(booking.totalPrice);
        setStep(3);
      })
      .catch((err) => {
        console.error("Booking failed:", err);
        setError("Booking failed. Please try again.");
        setStep(1);
      });
  };

  const handlePayment = () => {
    setStep(2);
    setError("");

    paymentService
      .processPayment(bookingId, totalPrice)
      .then(() => {
        setPaymentStatus("Paid");
        setStep(4);
      })
      .catch((err) => {
        console.error("Payment failed:", err);
        setError("Payment processing failed.");
        setStep(3);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4">
          {step === 4 ? "Booking Confirmed!" : `Book ${concert.name}`}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {step === 1 && (
            <>
              <p className="text-gray-600">
                Are you sure you want to book a ticket for{" "}
                <strong>{concert.name}</strong>?
              </p>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span>Price:</span>
                <span className="font-bold text-lg text-blue-600">
                  Rp {concert.price.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleBooking}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold"
              >
                Confirm Booking
              </button>
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Processing...</p>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">
                Booking ID: <strong>{bookingId}</strong> generated!
              </div>
              <p className="text-gray-600 mb-4">
                Please proceed to payment to finalize your booking.
              </p>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded mb-4">
                <span>Total Amount:</span>
                <span className="font-bold text-xl text-blue-600">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handlePayment}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-semibold"
              >
                Pay Now
              </button>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">
                Your ticket for <strong>{concert.name}</strong> has been
                successfully booked and paid for.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
