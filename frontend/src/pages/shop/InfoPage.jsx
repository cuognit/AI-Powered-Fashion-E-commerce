export default function InfoPage({ title, description }) {
  return (
    <div className="max-w-[1360px] mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900 mb-4">{title}</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-3xl">{description}</p>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>
          Chào mừng bạn đến với AESTHETIX. Chúng tôi mang đến trải nghiệm thời trang cao cấp với công nghệ thử đồ AI hiện đại và chính sách minh bạch.
        </p>
        <p>
          If you have any questions regarding your order, fitting profiles, or general inquiries, please contact our dedicated support team.
        </p>
      </div>
    </div>
  )
}
