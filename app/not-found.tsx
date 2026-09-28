import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="container lost">
      <div className="lost__code rise">404</div>
      <h1 className="rise" style={{ "--d": "80ms" } as React.CSSProperties}>
        Такой страницы нет
      </h1>
      <p className="rise" style={{ "--d": "160ms" } as React.CSSProperties}>
        Возможно, деталь сняли с продажи или ссылка устарела. Попробуйте найти её по артикулу.
      </p>
      <Link href="/" className="btn btn--primary rise" style={{ "--d": "240ms" } as React.CSSProperties}>
        <Icon name="search" /> К поиску
      </Link>
    </div>
  );
}
