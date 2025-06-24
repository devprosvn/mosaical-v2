import { useState } from 'react';
import { Card, Button, Spinner, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { formatUnits } from 'ethers';

const NFTCard = ({ 
  nft, 
  onDeposit,
  onWithdraw,
  onBorrow,
  onRepay,
  userPosition,
  canWithdraw = false,
  canBorrow = false,
  canRepay = false,
  isProcessing = false,
}) => {
  // Extract NFT metadata
  const tokenId = nft.tokenId || nft.id?.tokenId || '?';
  const name = nft.title || nft.metadata?.name || `NFT #${tokenId}`;
  const description = nft.description || nft.metadata?.description || 'No description available';
  const imageUrl = nft.media?.[0]?.gateway || nft.metadata?.image || 'https://via.placeholder.com/200?text=No+Image';
  const collectionName = nft.contract?.name || 'Unknown Collection';
  const collectionAddress = nft.contract?.address || nft.collectionAddress || '';

  // Format position values
  const formatDPSV = (value) => {
    if (!value) return '0 DPSV';
    try {
      return `${parseFloat(formatUnits(value, 18)).toFixed(4)} DPSV`;
    } catch (e) {
      return `${value} DPSV`;
    }
  };

  // Get LTV variant color based on value
  const getLtvVariant = (ltv) => {
    if (!ltv) return 'info';
    const ltvNum = parseFloat(ltv);
    if (ltvNum < 50) return 'success';
    if (ltvNum < 70) return 'warning';
    return 'danger';
  };

  // Tính toán kích thước card với tỷ lệ 3:2 (ngang:cao)
  const cardWidth = '480px';
  const cardHeight = '320px'; // Giảm chiều cao để tạo hình chữ nhật ngang
  const imageHeight = '90px'; // Giảm chiều cao của hình ảnh

  // Format contract address for display
  const formattedAddress = collectionAddress ? 
    `${collectionAddress.substring(0, 6)}...${collectionAddress.substring(collectionAddress.length - 4)}` : 
    '';

  // Determine if the NFT is at risk of liquidation
  const isAtRiskOfLiquidation = userPosition && userPosition.hasLoan && 
    userPosition.currentLTV && userPosition.liquidationThreshold &&
    parseFloat(userPosition.currentLTV) >= parseFloat(userPosition.liquidationThreshold) * 0.9;
    
  // Check if Oracle price is missing
  const hasOraclePrice = userPosition && userPosition.maxBorrow && userPosition.maxBorrow.toString() !== '0';

  return (
    <Card 
      className={`shadow-sm ${isAtRiskOfLiquidation ? 'border-danger' : 'border'}`}
      style={{ 
        width: cardWidth, 
        height: cardHeight,
        display: 'flex',
        flexDirection: 'row', // Thay đổi thành row để tạo layout ngang
        overflow: 'hidden'
      }}
    >
      {/* Phần hình ảnh bên trái */}
      <div style={{ 
        width: '40%', // Chiếm 40% chiều rộng của card
        height: '100%', 
        overflow: 'hidden', 
        padding: '10px' 
      }}>
        <Card.Img 
          src={imageUrl} 
          alt={name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            borderRadius: '8px'
          }}
        />
      </div>
      
      {/* Phần nội dung bên phải */}
      <Card.Body style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        padding: '10px'
      }}>
        <Card.Title className="text-truncate" title={name}>{name}</Card.Title>
        <Card.Subtitle className="mb-1 text-muted text-truncate" title={collectionName}>{collectionName}</Card.Subtitle>
        
        {/* Token ID and Contract Address */}
        <div className="mb-1">
          <small className="text-muted d-block">Token ID: {tokenId}</small>
          {formattedAddress && <small className="text-muted d-block">Contract: {formattedAddress}</small>}
        </div>
        
        {/* Show position details if available */}
        {userPosition && (
          <div className="mb-1 position-details" style={{ width: '100%' }}>
            {/* Oracle Price Missing Warning */}
            {!hasOraclePrice && canBorrow && (
              <Alert variant="warning" className="p-1 mb-1">
                <small>Oracle price not set</small>
              </Alert>
            )}
            
            {/* Max Borrow Amount */}
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small">Max Borrow:</span>
              <Badge bg="info">{formatDPSV(userPosition.maxBorrow)}</Badge>
            </div>
            
            {/* Current LTV with progress bar */}
            <div className="mb-1">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Current LTV:</span>
                <Badge bg={getLtvVariant(userPosition.currentLTV)}>
                  {userPosition.currentLTV ? `${parseFloat(userPosition.currentLTV).toFixed(2)}%` : '0%'}
                </Badge>
              </div>
              {userPosition.currentLTV && userPosition.liquidationThreshold && (
                <ProgressBar 
                  now={parseFloat(userPosition.currentLTV)} 
                  max={parseFloat(userPosition.liquidationThreshold)}
                  variant={getLtvVariant(userPosition.currentLTV)}
                  style={{ height: '4px' }}
                  className="mt-1"
                />
              )}
            </div>
            
            {/* Total Debt */}
            {userPosition.hasLoan && (
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Total Debt:</span>
                <Badge bg="danger">{formatDPSV(userPosition.totalDebt)}</Badge>
              </div>
            )}
            
            {/* Liquidation Warning */}
            {isAtRiskOfLiquidation && (
              <div className="mt-1 text-center">
                <Badge bg="danger" className="w-100 py-1">At Risk of Liquidation</Badge>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="d-flex justify-content-center gap-2 mt-auto">
          {onDeposit && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => onDeposit(nft)}
              disabled={isProcessing}
            >
              {isProcessing ? <Spinner animation="border" size="sm" /> : 'Deposit'}
            </Button>
          )}
          
          {canWithdraw && onWithdraw && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => onWithdraw(nft)}
              disabled={isProcessing || (userPosition && userPosition.hasLoan)}
            >
              {isProcessing ? <Spinner animation="border" size="sm" /> : 'Withdraw'}
            </Button>
          )}
          
          {canBorrow && onBorrow && (
            <Button 
              variant="success" 
              size="sm" 
              onClick={() => onBorrow(nft)}
              disabled={isProcessing || !hasOraclePrice}
            >
              {isProcessing ? <Spinner animation="border" size="sm" /> : 'Borrow'}
            </Button>
          )}
          
          {canRepay && onRepay && (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => onRepay(nft)}
              disabled={isProcessing || !userPosition || !userPosition.hasLoan}
            >
              {isProcessing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Repaying...
                </>
              ) : (
                'Repay Full Amount'
              )}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default NFTCard; 