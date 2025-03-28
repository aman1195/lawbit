
import Navbar from "@/components/Navbar";
import EnhancedContractForm from "@/components/EnhancedContractForm";

const Contracts = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-medium mb-4">Create Contract</h1>
            <p className="text-lg text-muted-foreground">
              Generate a new contract with our intelligent contract builder.
            </p>
          </div>
          
          <EnhancedContractForm />
        </div>
      </main>
      
      <footer className="border-t py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LawBit. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Contracts;
