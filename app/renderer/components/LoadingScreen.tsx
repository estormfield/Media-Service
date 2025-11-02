import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" aria-hidden="true" />
      <p className="loading-label">Loading launcher...</p>
    </div>
  );
}
