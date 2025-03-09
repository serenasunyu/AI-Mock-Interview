import React from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="bg-white shadow-sm rounded-2xl p-4 max-w-sm w-60 h-70 flex flex-col items-start">
      <Icon className="w-8 h-8 text-black mb-4" />
      <h3 className="text-lg font-bold text-black pb-4">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard;
