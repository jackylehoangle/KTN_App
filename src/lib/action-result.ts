import { ZodError } from 'zod';

// Next.js ẩn nội dung mọi lỗi `throw` từ Server Action khi chạy production (chỉ hiện
// đầy đủ ở dev mode) — client chỉ thấy "An error occurred in the Server Components
// render..." thay vì thông báo tiếng Việt thật. Bọc thân mỗi action bằng runAction()
// để bắt lỗi ngay bên trong (trước khi kịp vượt biên Server Action) và trả về dưới
// dạng giá trị bình thường thay vì throw — nhờ vậy message gốc không bị Next.js xoá.
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ZodError) {
      return { ok: false, error: e.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Có lỗi xảy ra' };
  }
}
