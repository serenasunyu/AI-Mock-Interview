import React from "react";

interface ReviewCardProps {
  image: string;
  name: string;
  role: string;
  review: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ image, name, role, review }) => {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center text-center max-w-sm w-64 h-80">
      <img className="w-16 h-16 rounded-full mb-4" src={image} alt={name} />
      <p className="text-gray-700 mb-4">{review}</p>
      <div>
        <p className="font-bold">{name}</p>
        <p className="text-gray-500 text-sm">{role}</p>
      </div>
    </div>
  );
};

export default ReviewCard;
