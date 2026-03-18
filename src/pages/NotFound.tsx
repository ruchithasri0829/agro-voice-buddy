import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen surface-gradient flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-gradient">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link to="/auth" className="inline-block px-6 py-3 rounded-lg hero-gradient text-primary-foreground font-medium">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
