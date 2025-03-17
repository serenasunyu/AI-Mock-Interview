import Container from "@/components/Container";
import FeatureCard from "@/components/FeatureCard";
import HowItWorks from "@/components/HowItWorks";
import ReviewCard from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { LineChart, MessageCircle, PieChart, WebcamIcon } from "lucide-react";
import Marquee from "react-fast-marquee";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-gray-100 flex-col w-full">
      <Container>
        <div className="flex flex-col items-center justify-center md:flex-row gap-10 p-4">
          <div className="my-8 md:w-1/2">
            <h2 className="text-4xl text-center md:text-left md:text-3xl pb-4">
              Ace Your Next Interview with MockMate
            </h2>
            <p className="text-gray-700 text-center md:text-left md:text-xl">
              AI-Powered Interview Practice That Gets You Hired
            </p>

            <p className="mt-4 text-md text-center md:text-left">
              {/* Practice with realistic interview scenarios, get instant feedback,
              and improve your interview skills with our AI interviewer. */}
              Generate personalized, job-specific interview questions based on your role and interview type. Practice with realistic mock interviews, record your responses, and receive AI-powered feedback to improve your answers.
            </p>

            <div className="flex gap-4 mt-15 items-center justify-center">
              <Link
                to="/generate"
                className="hover:text-black text-white"
              >
                <Button className="w-40 h-10 bg-indigo-500 hover:bg-indigo-300 hover:text-black">
                  Start Now
                </Button>
              </Link>
              <Link
                to="/demo"
                className="hover:text-black text-white"
              >
                <Button className="w-40 h-10 bg-white text-black hover:bg-indigo-300 hover:text-white border">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* image section */}
          {/* <div className="w-full mt-4 md:w-1/2 rounded-xl bg-gray-100 h-[420px] drop-shadow-md overflow-hidden relative">
            <img
              src="src/assets/img/hero.jpg"
              alt="hero image"
              className="w-full h-full object-cover"
            />

            <div className="absolute top-4 left-4 px-4 py-2 rounded-md bg-white/40 backdrop-blur-md">
              Interviews Copilot&copy
            </div>

            <div className="hidden md:block absolute w-80 bottom-4 right-4 px-4 py-2 rounded-md bg-white/60 backdrop-blur-md">
              <h2 className="text-neutral-800 font-semibold">Developer</h2>
              <p className="text-sm text-neutral-500">
                prepare for the interview.
              </p>

              <Button className="mt-3">
                Generate <Sparkles />
              </Button>
            </div>
          </div> */}

          <div className="w-full mt-4 md:w-1/2 rounded-xl bg-gray-100 h-[420px] drop-shadow-md overflow-hidden relative">
            <video
              src="src/assets/video/hero-video.mp4"
              // alt="hero video"
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />

            <div className="absolute top-4 left-4 px-4 py-2 rounded-md bg-white/40 backdrop-blur-md">
              MockMate&copy;
            </div>

            {/* <div className="hidden md:block absolute w-80 bottom-4 right-4 px-4 py-2 rounded-md bg-white/60 backdrop-blur-md">
      <h2 className="text-neutral-800 font-semibold">Developer</h2>
      <p className="text-sm text-neutral-500">
        Prepare for the interview.
      </p>

      <Button className="mt-3">
        Generate <Sparkles />
      </Button>
    </div> */}
          </div>
        </div>

        {/* features */}
        <section className="flex flex-col bg-gray-50 rounded-lg">
          <h2 className="text-center pt-18 text-4xl font-bold mb-8 text-gray-800">AI-Driven Features to Elevate Your Interview Performance</h2>
          <div className="py-16 bg-gray-50 rounded-lg flex flex-wrap justify-center gap-10">
          <FeatureCard
            icon={MessageCircle}
            title="AI Interview Simulation"
            description="Practice with our advanced AI interviewer that adapts to your responses"
          />
          <FeatureCard
            icon={LineChart}
            title="Real-time Feedback"
            description="Get immediate insights on your performance and areas for improvement"
          />
          <FeatureCard
            icon={PieChart}
            title="Performance Analysis"
            description="Track your progress with detailed analytics and scoring"
          />
          <FeatureCard
            icon={WebcamIcon}
            title="Record Your Interviews"
            description="Capture your mock interviews and play them back to analyze your responses, body language, and speaking style"
          />
          </div>
        </section>

        {/* how it works */}
        <section>
          <HowItWorks />
        </section>
      </Container>

      {/* customer reviews marquee */}
      <section className="py-16 bg-gray-50 rounded-lg">
        <h2 className="text-center text-4xl text-gray-800 font-bold mb-10">
          What Our Users Say
        </h2>
        <Marquee gradient={false} speed={50} pauseOnHover className="gap-5">
          <div className="flex flex-wrap justify-center gap-5">
            <ReviewCard
              image="src/assets/img/Sarah.png"
              name="Sarah Johnson"
              role="Software Engineer at Google"
              review="MockMate helped me prepare for my technical interviews effectively. The AI feedback was spot on!"
            />
            <ReviewCard
              image="src/assets/img/Micheal.png"
              name="Micheal Chen"
              role="Product Manager at Microsoft"
              review="The practice sessions were incredibly realistic. I felt well-prepared for my actual interviews."
            />
            <ReviewCard
              image="src/assets/img/Emily.png"
              name="Emily Rodriguez"
              role="UX Designer at Apple"
              review="Thanks to MockMate, I gained the confidence I needed to ace my dream job interview."
            />
            <ReviewCard
              image="src/assets/img/david.png"
              name="David Lee"
              role="Data Scientist at Amazon"
              review="MockMate's AI-driven feedback was incredibly insightful. It helped me refine my answers and boost my confidence."
            />
            <ReviewCard
              image="src/assets/img/jessica.png"
              name="Jessica Wong"
              role="Frontend Developer at Meta"
              review="The mock interviews felt just like the real thing. I walked into my interviews fully prepared and landed my dream role!"
            />
          </div>
        </Marquee>
      </section>

      <Container>
        {/* call to action */}
        <div className="flex flex-col justify-center items-center py-12">
          <h1 className="font-extrabold text-4xl text-center text-gray-800">
            Ready to Land Your Dream Job?
          </h1>
          <Link to="/generate">
          <Button className="bg-indigo-500 mt-4 font-bold hover:bg-indigo-300 hover:text-black">
            Start Free Practice
          </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default Home;
