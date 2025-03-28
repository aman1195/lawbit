import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 pb-16 pt-24 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div
          className={`transition-all duration-700 delay-100 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-block py-1 px-3 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Intelligent Document Analysis
          </span>
        </div>

        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-medium leading-tight md:leading-tight lg:leading-tight transition-all duration-700 delay-300 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Document Management with{" "}
          <span className="text-primary relative">
            Precision
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/30 rounded-full"></span>
          </span>
        </h1>

        <p
          className={`text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto transition-all duration-700 delay-500 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Analyze and manage contracts with intelligent risk assessment. Streamline your document workflow with our intuitive platform.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-700 delay-700 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Link to="/contracts">
              Create Contract
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
          >
            <Link to="/documents">
              View Documents
            </Link>
          </Button>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-primary/5 filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 filter blur-3xl"></div>
      </div>
    </section>
  );
};

export default Hero;
