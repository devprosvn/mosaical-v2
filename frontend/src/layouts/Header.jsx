import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import WalletConnector from '../components/WalletConnector';

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="ms-2 d-flex align-items-center">
          <img src="/logo.svg" alt="Mosaical" style={{ height: '32px', width: 'auto' }} />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="mx-2">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/loans" className="mx-2">Loans</Nav.Link>
            <Nav.Link as={Link} to="/dpo-tokens" className="mx-2">DPO Tokens</Nav.Link>
            <Nav.Link as={Link} to="/admin" className="mx-2">Admin</Nav.Link>
          </Nav>
          <WalletConnector />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 