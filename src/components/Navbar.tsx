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
import Button from "@/components/Button";
import Header from "@/components/Header";

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
    <Header>
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4">
        <Link to="/" className="flex items-center space-x-2 text-primary">
          <div className="h-full w-full rounded-lg flex items-center justify-center">
            <img src="/images/lawbit-logo.png" alt="LawBit" className="h-20 w-full object-contain" />
          </div>
          
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
                <Button 
                  className="ml-4"
                  title={
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>Account</span>
                    </div>
                  }
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass w-56 z-50">
                <div className="p-2 text-sm font-medium">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              title="Sign In"
              href="/auth"
            />
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          className="md:hidden"
          title={
            <div className="text-foreground">
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </div>
          }
          onClick={toggleMobileMenu}
        />
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 pt-16 bg-background/80 backdrop-blur-xl z-40">
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
              <Button
                title={
                  <div className="flex flex-col items-center justify-center">
                    <LogOut className="h-6 w-6 mb-1" />
                    Sign Out
                  </div>
                }
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
              />
            ) : (
              <Button
                title={
                  <div className="flex flex-col items-center justify-center">
                    <User className="h-6 w-6 mb-1" />
                    Sign In
                  </div>
                }
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </Header>
  );
};

export default Navbar;
