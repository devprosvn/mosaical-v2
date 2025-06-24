import { Container } from 'react-bootstrap';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="py-4 flex-grow-1">
        {children}
      </Container>
      <footer className="bg-dark text-white p-3 text-center">
        <Container>
          <p className="mb-0">© {new Date().getFullYear()} Mosaical DeFi - GameFi NFT Lending Platform</p>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout; 