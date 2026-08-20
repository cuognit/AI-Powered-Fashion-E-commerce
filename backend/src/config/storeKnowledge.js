/**
 * Nguồn tri thức chuẩn hoá của Cửa hàng Thời trang (Store Knowledge Base)
 * Bao gồm: Chính sách đổi trả, vận chuyển, thanh toán, bảng size, bảo quản chất liệu và gợi ý phối đồ.
 */

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const STORE_KNOWLEDGE = {
  returnPolicy: {
    title: 'Chính sách Đổi trả & Hoàn tiền',
    content: `1. Thời gian đổi hàng: Trong vòng 07 ngày kể từ khi nhận hàng thành công.
2. Điều kiện đổi hàng: Sản phẩm còn nguyên tem mác, chưa qua sử dụng, chưa giặt ủi và còn hóa đơn/mã đơn hàng.
3. Trường hợp lỗi từ nhà sản xuất (rách, ố màu, sai mẫu/size so với đơn): Cửa hàng hỗ trợ đổi 1-1 miễn phí 100% phí vận chuyển.
4. Trường hợp khách muốn đổi size/mẫu vì không vừa hoặc đổi sở thích: Khách hàng hỗ trợ phí vận chuyển 2 chiều (hoặc đổi trực tiếp miễn phí tại cửa hàng).
5. Hoàn tiền: Áp dụng trong vòng 24-48h qua chuyển khoản/VNPAY khi sản phẩm hết hàng để đổi.`,
  },
  shippingPolicy: {
    title: 'Chính sách Vận chuyển & Giao nhận',
    content: `1. Phí vận chuyển:
   - MIỄN PHÍ VẬN CHUYỂN toàn quốc cho đơn hàng từ 500.000 VNĐ.
   - Đơn hàng dưới 500.000 VNĐ: Phí giao hàng tiêu chuẩn đồng giá 30.000 VNĐ.
2. Thời gian giao hàng:
   - Nội thành Hà Nội & TP. Hồ Chí Minh: 1 - 2 ngày làm việc (có hỗ trợ giao hỏa tốc 2h nếu liên hệ hotline).
   - Các tỉnh/thành phố khác: 2 - 4 ngày làm việc.
3. Đơn vị vận chuyển đối tác: Giao Hàng Tiết Kiệm (GHTK), Giao Hàng Nhanh (GHN), Viettel Post.
4. Kiểm tra hàng: Khách hàng được quyền đồng kiểm (kiểm tra mẫu mã, số lượng) trước khi thanh toán COD.`,
  },
  paymentPolicy: {
    title: 'Phương thức Thanh toán',
    content: `1. Thanh toán khi nhận hàng (COD): Nhận hàng kiểm tra và thanh toán tiền mặt cho nhân viên giao hàng.
2. Thanh toán trực tuyến qua VNPAY: Hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa, Internet Banking và thẻ tín dụng Visa/MasterCard an toàn tuyệt đối.
3. Khuyến mãi & Coupon: Nhập mã giảm giá tại bước thanh toán để được trừ trực tiếp vào tổng tiền.`,
  },
  sizeGuide: {
    title: 'Bảng Hướng dẫn Chọn Size Chuẩn (Nam & Nữ)',
    content: `[BẢNG SIZE NAM]:
- Size S: Chiều cao 1m58 - 1m65, Cân nặng 50 - 58kg (Vòng ngực ~88-92cm)
- Size M: Chiều cao 1m65 - 1m70, Cân nặng 58 - 65kg (Vòng ngực ~92-96cm)
- Size L: Chiều cao 1m70 - 1m75, Cân nặng 65 - 73kg (Vòng ngực ~96-100cm)
- Size XL: Chiều cao 1m75 - 1m80, Cân nặng 73 - 82kg (Vòng ngực ~100-106cm)
- Size XXL: Chiều cao 1m78 - 1m88, Cân nặng 82 - 92kg (Vòng ngực ~106-112cm)

[BẢNG SIZE NỮ]:
- Size S: Chiều cao 1m50 - 1m56, Cân nặng 42 - 48kg (Vòng ngực ~80-84cm, Eo ~62-66cm)
- Size M: Chiều cao 1m56 - 1m62, Cân nặng 48 - 54kg (Vòng ngực ~84-88cm, Eo ~66-70cm)
- Size L: Chiều cao 1m60 - 1m66, Cân nặng 54 - 60kg (Vòng ngực ~88-92cm, Eo ~70-75cm)
- Size XL: Chiều cao 1m65 - 1m72, Cân nặng 60 - 68kg (Vòng ngực ~92-98cm, Eo ~75-82cm)

[LƯU Ý DÁNG NGƯỜI & FORM ÁO]:
- Form Regular Fit: Chuẩn form tôn dáng, chọn đúng bảng size.
- Form Slim Fit: Ôm nhẹ, nếu có bụng hoặc vai to nên tăng 1 size.
- Form Oversize: Rộng rãi thoải mái phong cách đường phố, nếu thích mặc vừa vặn có thể lùi 1 size.
- Khách hàng ở khoảng giữa 2 size: Nếu thích mặc ôm chọn size nhỏ, thích thoải mái nên chọn size lớn hơn.`,
  },
  fabricCareGuide: {
    title: 'Hướng dẫn Giặt ủi & Bảo quản theo Chất liệu',
    content: `1. Vải Cotton / Thun (Áo phông, Polo):
   - Giặt nước lạnh dưới 30°C, lộn trái áo khi giặt và phơi để giữ màu và hình in.
   - Hạn chế sấy nhiệt độ cao để tránh co rút vải; ủi ở nhiệt độ trung bình.
2. Vải Linen / Đũi:
   - Ưu tiên giặt tay hoặc giặt máy chế độ nhẹ, không vắt xoắn kiệt nước.
   - Phơi trong bóng râm, ủi bằng bàn ủi hơi nước khi áo còn hơi ẩm.
3. Vải Lụa / Satin:
   - Giặt nhẹ nhàng bằng nước mát với dầu gội hoặc sữa tắm nhẹ, không dùng chất tẩy mạnh.
   - Ủi mặt trái với mức nhiệt thấp nhất chuyên dụng cho lụa.
4. Vải Len / Nỉ (Sweater, Hoodie):
   - Giặt bằng nước lạnh, phơi ngang trên mặt phẳng để tránh chảy xệ và dão dáng áo.
5. Vải Denim / Bò (Quần Jean, Áo khoác Jean):
   - Lộn trái khi giặt, không giặt chung với đồ sáng màu; hạn chế giặt quá thường xuyên để giữ form và màu wash đẹp.`,
  },
  styleGuide: {
    title: 'Gợi ý Phối đồ & Phong cách Thời trang (Style Guide)',
    content: `1. Phong cách Công sở / Đi làm (Smart Casual & Business):
   - Nam: Áo sơ mi dài tay / Polo cao cấp + Quần tây / Kaki ống suông + Áo blazer lịch lãm + Giày tây / Loafer.
   - Nữ: Áo sơ mi lụa / Blazer thanh lịch + Chân váy chữ A / Quần tây cạp cao + Giày cao gót / Mules.
2. Phong cách Dạo phố / Đi chơi (Casual & Streetwear):
   - Nam: Áo thun Oversize / Hoodie + Quần Jean rách nhẹ / Quần Short túi hộp + Sneaker trẻ trung.
   - Nữ: Áo croptop / Áo thun + Quần Jean ống rộng / Chân váy tennis + Giày thể thao năng động.
3. Phong cách Dự tiệc / Sự kiện (Party & Formal):
   - Nam: Bộ Suit hoàn chỉnh hoặc Blazer tối màu + Sơ mi trắng + Quần âu + Phụ kiện thắt lưng da.
   - Nữ: Đầm dạ hội / Váy lụa thắt eo sang trọng + Giày cao gót + Túi xách cầm tay.
4. Phong cách Đi biển / Mùa hè (Summer Vacation):
   - Áo sơ mi họa tiết / đũi cộc tay + Quần short linen + Kính râm + Sandal / Dép da thoáng khí.`,
  },
}

/**
 * Trích xuất tri thức cửa hàng phù hợp với câu hỏi của người dùng
 * @param {string} query - Câu hỏi của khách
 * @returns {string} - Nội dung tri thức liên quan hoặc chuỗi rỗng
 */
export function retrieveStoreKnowledge(query) {
  const norm = normalizeText(query)
  if (!norm) return ''

  const results = []

  // 1. Kiểm tra chính sách đổi trả
  if (/(đổi|trả|hoàn tiền|lỗi|bảo hành|đổi size|đổi mẫu|trả hàng|bao nhiêu ngày)/i.test(norm)) {
    results.push(`[${STORE_KNOWLEDGE.returnPolicy.title}]:\n${STORE_KNOWLEDGE.returnPolicy.content}`)
  }

  // 2. Kiểm tra chính sách vận chuyển, giao hàng, phí ship
  if (/(ship|phí giao|vận chuyển|bao lâu|giao hàng|hỏa tốc|mất mấy ngày|đơn vị giao)/i.test(norm)) {
    results.push(`[${STORE_KNOWLEDGE.shippingPolicy.title}]:\n${STORE_KNOWLEDGE.shippingPolicy.content}`)
  }

  // 3. Kiểm tra thanh toán
  if (/(thanh toán|vnpay|cod|tiền mặt|chuyển khoản|mã giảm giá|coupon|voucher)/i.test(norm)) {
    results.push(`[${STORE_KNOWLEDGE.paymentPolicy.title}]:\n${STORE_KNOWLEDGE.paymentPolicy.content}`)
  }

  // 4. Kiểm tra tư vấn Size, chiều cao, cân nặng
  if (/(size|kích cỡ|chiều cao|cân nặng|mặc vừa|1m|kg|nặng|cao|chật|rộng|vòng ngực|vòng eo|bảng size|tăng size|giảm size)/i.test(norm)) {
    results.push(`[${STORE_KNOWLEDGE.sizeGuide.title}]:\n${STORE_KNOWLEDGE.sizeGuide.content}`)
  }

  // 5. Kiểm tra bảo quản, giặt ủi, chất liệu vải
  if (/(giặt|ủi|là|bảo quản|co rút|phai màu|xù lông|chất vải|chất liệu|cotton|linen|đũi|lụa|satin|len|jean|denim)/i.test(norm)) {
    results.push(`[${STORE_KNOWLEDGE.fabricCareGuide.title}]:\n${STORE_KNOWLEDGE.fabricCareGuide.content}`)
  }

  // 6. Kiểm tra phối đồ, gợi ý phong cách, mix match
  if (/(phối đồ|mặc gì|kết hợp|mix|match|outfit|set đồ|đi làm|công sở|đi chơi|dạo phố|đi tiệc|dự tiệc|đi biển|sự kiện|phong cách)/i.test(norm)) {
    results.push(`[${STORE_KNOWLEDGE.styleGuide.title}]:\n${STORE_KNOWLEDGE.styleGuide.content}`)
  }

  return results.join('\n\n')
}

export default {
  STORE_KNOWLEDGE,
  retrieveStoreKnowledge,
}
