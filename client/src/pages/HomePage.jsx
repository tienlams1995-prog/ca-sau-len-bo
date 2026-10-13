/*
 * FILE: client/src/pages/HomePage.jsx — TRANG CHỦ
 * Giới thiệu trò chơi dân gian và luật chơi phiên bản web.
 */
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="home">
      <div className="hero">
        <h1>🐊 Cá Sấu Lên Bờ</h1>
        <p className="lead">
          Trò chơi dân gian tuổi thơ, nay chơi trên trình duyệt. Chạy qua sông, đừng để cá sấu đớp!
        </p>
        <Link to="/play" className="btn btn-large">
          Chơi ngay
        </Link>
      </div>

      <div className="card">
        <h2>Luật chơi</h2>
        <ul className="rules">
          <li>🟩 Các ô cỏ là <b>bờ</b>, cá sấu không lên được bờ.</li>
          <li>🌊 Phần màu xanh là <b>sông</b>, nơi cá sấu bơi.</li>
          <li>🏃 Chạy sang <b>một bờ khác</b> được +10 điểm. Mỗi giây sống sót được +1 điểm.</li>
          <li>⏳ Không được đứng trên một bờ quá lâu, vòng trắng quanh bạn là thời gian còn lại.</li>
          <li>🎯 Qua sông đủ số lần ghi trên màn hình để <b>qua màn</b>. Màn sau khó hơn một chút.</li>
          <li>🐍 Từ màn 3 có <b>rắn</b>: bò chậm nhưng lên được bờ, nên đừng đứng yên!</li>
          <li>🖼️ Bạn có thể <b>upload avatar</b> để gắn lên người chơi, cá sấu và rắn.</li>
          <li>⌨️ Điều khiển bằng <b>phím mũi tên / WASD</b>, hoặc <b>giữ chuột / chạm</b> vào nơi muốn chạy tới.</li>
        </ul>
      </div>
    </section>
  );
}
