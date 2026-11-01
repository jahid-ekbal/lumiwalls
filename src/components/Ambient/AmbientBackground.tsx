// Decorative ambient layer. The parent must be `relative isolate` so the
// negative z-index stays above the parent background and below its content.
const AmbientBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="ambient-wash"
    />
  );
};

export default AmbientBackground;
