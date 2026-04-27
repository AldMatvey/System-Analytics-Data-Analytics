export default function HourlyLoadChart({ data }) {
  const currentHour = `${String(new Date().getHours()).padStart(2, "0")}:00`;

  return (
    <div className="chart">
      {data.map((item) => (
        <div key={item.hour} className={`chart-row ${item.hour === currentHour ? "current" : ""}`}>
          <span className="chart-hour">{item.hour}</span>
          <div className="chart-bar-track">
            <div
              className="chart-bar-fill"
              style={{ width: `${item.load}%` }}
              aria-label={`Загруженность ${item.load}%`}
            />
          </div>
          <span className="chart-value">{item.load}%</span>
        </div>
      ))}
    </div>
  );
}
