import { motion, useScroll, MotionValue } from "framer-motion";
import { useRef, FC } from "react";

interface StepType {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface StepProps {
  step: StepType;
  progress: MotionValue<number>;
}

const steps: StepType[] = [
  {
    id: 1,
    title: "Type Your Interview Details",
    description:
      "Fill the job title, job description, and tech stack to customize your interview questions.",
    icon: "📝",
  },
  {
    id: 2,
    title: "Practice with AI Interviewer",
    description: "Answer AI-driven questions in a real interview setting.",
    icon: "🤖",
  },
  {
    id: 3,
    title: "Get Detailed Feedback",
    description: "Receive AI-generated insights to improve your responses.",
    icon: "📊",
  },
  {
    id: 4,
    title: "Track Your Progress",
    description: "Monitor your performance and enhance your skills over time.",
    icon: "📈",
  },
];

const DecorativeEffect: FC = () => {
  return (
    <div className="absolute right-10 top-90 h-1/2 w-1/2 md:w-1/3 overflow-hidden pointer-events-none">
      {/* Grid of dots */}
      <div className="absolute inset-0 grid grid-cols-6 pr-4">
        {Array(6 * 8)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="relative">
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-orange-300 opacity-70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{
                  duration: 1.5,
                  delay: index * 0.01,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              ></motion.div>
            </div>
          ))}
      </div>

      {/* Purple triangle */}
      <motion.div
        className="absolute top-1/2 right-12 w-12 h-24"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="absolute bottom-0 w-full h-full">
          <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 200 L100 200 L50 0 Z" fill="#8B5CF6" />
          </svg>
        </div>
      </motion.div>

      {/* Orange half-circle */}
      <motion.div
        className="absolute top-3/4 left-1 w-10 h-10"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
      >
        <div className="w-full h-full overflow-hidden">
          <div className="w-full h-full rounded-full bg-orange-500"></div>
        </div>
      </motion.div>

      {/* Green circle */}
      <motion.div
        className="absolute top-1/4 right-1/3 w-6 h-6 rounded-full bg-green-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      ></motion.div>

      {/* Play button triangle */}
      <motion.div
        className="absolute top-1/6 left-1/6 w-12 h-12"
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        whileHover={{ scale: 1.1 }}
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5v14l11-7z" fill="#d8b4fe" />
        </svg>
      </motion.div>
    </div>
  );
};

const Step: FC<StepProps> = ({ step, progress }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="mb-28 relative">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200" />

      {/* Progress indicator */}
      <motion.div
        className="absolute left-0 top-0 w-1 bg-purple-500"
        style={{
          height: progress,
          transformOrigin: "top",
        }}
      />

      {/* Step content with animations */}
      <motion.div
        className="ml-12 relative"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Circle with number */}
        <motion.div
          className="absolute -left-16 w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 text-white shadow-lg z-10 font-bold"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {step.id}
        </motion.div>

        {/* Content card */}
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          whileHover={{
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">{step.icon}</div>
            <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
          </div>
          <p className="text-gray-600">{step.description}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

const HowItWorks: FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  return (
    <section className="py-24 bg-gray-50 relative" ref={containerRef}>
      <div className="max-w-6xl mx-auto px-8">
        <motion.h2
          className="text-center text-4xl font-bold mb-16 text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How It Works
        </motion.h2>

        {/* Small screens: Steps in full width */}
        <div className="lg:hidden">
          <div className="relative pl-8 max-w-xl mx-auto">
            {steps.map((step) => (
              <Step key={step.id} step={step} progress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* Large screens: Condensed steps left, Effect right */}
        <div className="hidden lg:flex justify-between items-center">
          {/* Left side: Steps - more condensed */}
          <div className="w-1/2">
            <div className="relative pl-8">
              {steps.map((step) => (
                <Step key={step.id} step={step} progress={scrollYProgress} />
              ))}
            </div>
          </div>

          {/* Right side: Condensed effect in center */}
          <div className="w-1/2 flex justify-center items-center mx-auto">
            <DecorativeEffect />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
