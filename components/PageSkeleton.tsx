/** Скелетон внутренней страницы на время загрузки: заголовок и список строк. */
export function PageSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="Загрузка">
      <div className="container">
        <span className="sk" style={{ width: 120, height: 20, marginTop: 8 }} />
        <div className="page-head">
          <div className="page-head__row">
            <span className="sk" style={{ width: 72, height: 72, borderRadius: 20 }} />
            <div style={{ flex: 1 }}>
              <span className="sk" style={{ width: "45%", height: 28 }} />
              <span className="sk" style={{ width: "25%", height: 16, marginTop: 10 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="sk-row">
              <span className="sk" style={{ width: 52, height: 52, borderRadius: 14, flex: "none" }} />
              <div style={{ flex: 1 }}>
                <span className="sk" style={{ width: "35%", height: 16 }} />
                <span className="sk" style={{ width: "70%", height: 14, marginTop: 8 }} />
              </div>
              <span className="sk" style={{ width: 90, height: 22 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
