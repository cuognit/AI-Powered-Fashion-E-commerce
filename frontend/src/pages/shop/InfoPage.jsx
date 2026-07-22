export default function InfoPage({ title, description }) {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6">
      <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900 mb-4">{title}</h1>
      <p className="text-sm text-gray-500 mb-8">{description}</p>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>
          Welcome to AESTHETIX. We are dedicated to providing an unparalleled luxury experience backed by cutting-edge neural fit technology and transparent policies.
        </p>
        <p>
          If you have any questions regarding your order, fitting profiles, or general inquiries, please contact our dedicated support team.
        </p>
      </div>
    </div>
  )
}
