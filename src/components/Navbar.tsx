import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, FileCheck, Menu, X, Upload, User, LogOut } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Sign out failed", {
        description: error.message,
      });
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const navLinks = [
    { name: "Contracts", path: "/contracts", icon: FileText, requireAuth: true },
    { name: "Documents", path: "/documents", icon: FileCheck, requireAuth: true },
    { name: "Analyze Document", path: "/document-analysis", icon: Upload, requireAuth: true },
  ];

  // Filter links based on authentication status
  const filteredLinks = navLinks.filter(link => {
    return !link.requireAuth || (link.requireAuth && user);
  });

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 transition-all duration-300",
        isScrolled
          ? "glass shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-primary">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-medium">LawBit</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {filteredLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "py-2 text-sm font-medium animated-underline",
                location.pathname === link.path
                  ? "text-primary after:w-full"
                  : "text-foreground/80 hover:text-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-4">
                  <User className="h-4 w-4 mr-2" />
                  <span>Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2 text-sm font-medium">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 pt-16 bg-background glass-card z-40">
          <div className="flex flex-col p-6 space-y-6 text-center">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "py-3 text-lg font-medium",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-foreground/80"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex flex-col items-center justify-center">
                  {link.icon && <link.icon className="h-6 w-6 mb-1" />}
                  {link.name}
                </div>
              </Link>
            ))}
            
            {user ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="py-3 text-lg font-medium text-foreground/80"
              >
                <div className="flex flex-col items-center justify-center">
                  <LogOut className="h-6 w-6 mb-1" />
                  Sign Out
                </div>
              </button>
            ) : (
              <Link
                to="/auth"
                className="py-3 text-lg font-medium text-foreground/80"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex flex-col items-center justify-center">
                  <User className="h-6 w-6 mb-1" />
                  Sign In
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
