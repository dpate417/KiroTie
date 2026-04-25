export default function PredictionResultPanel({ data, isMock }) {
  if (!data) return null

  return (
    <div className="mt-6 space-y-4">
      {isMock && (
        <div className="rounded-md bg-yellow-50 border border-yellow-300 px-4 py-2 text-sm text-yellow-800 font-medium">
          Live prediction unavailable — showing mock data
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-base font-semibold text-gray-800">Prediction Results</h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Predicted Attendance</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.predicted_attendance}</p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Planned Quantity</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.planned_quantity}</p>
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Food Waste (lbs)</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{data.food_waste_lbs}</p>
          </div>
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-xs text-green-600 uppercase tracking-wide">Total Savings (USD)</p>
            <p className="mt-1 text-xl font-bold text-green-800">${data.total_savings_usd}</p>
          </div>
        </div>

        {data.factors && data.factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Contributing Factors</h4>
            <ul className="space-y-2">
              {data.factors.map((factor, i) => (
                <li key={i} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-800">{factor.label}</span>
                  <span className="mx-2 text-gray-400">·</span>
                  <span className="text-gray-500 capitalize">{factor.impact} impact</span>
                  <p className="mt-0.5 text-gray-600">{factor.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
