export default function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="srow">
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}
