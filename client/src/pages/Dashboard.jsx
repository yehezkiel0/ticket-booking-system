import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingModal from "../components/BookingModal";
import { productService } from "../services/productService";

const Dashboard = () => {
  const [popularConcerts, setPopularConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const responseData = await productService.getPopularConcerts(
          page,
          limit
        );
        const data = responseData.data ? responseData.data : responseData;
        const meta = responseData.meta;

        setPopularConcerts(data);
        if (meta) {
          setTotalPages(meta.totalPages);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Popular Concerts</h1>

      {loading ? (
        <p>Loading concerts...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {popularConcerts.map((concert) => (
              <div
                key={concert.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="h-40 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                  {concert.name}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{concert.name}</h2>
                  <p className="text-gray-600">
                    Price:{" "}
                    <span className="text-green-600 font-bold">
                      Rp {concert.price.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Available Seats: {concert.seats}
                  </p>
                  <button
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                    onClick={() => setSelectedConcert(concert)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className={`px-4 py-2 rounded-md font-semibold ${
                page === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            <span className="text-gray-700 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-md font-semibold ${
                page === totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedConcert && (
        <BookingModal
          concert={selectedConcert}
          onClose={() => setSelectedConcert(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
