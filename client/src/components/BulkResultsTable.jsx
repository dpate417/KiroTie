export default function BulkResultsTable({ data, isMock }) {
  if (!data) return null

  return (
    <div className="mt-6 space-y-4">
      {isMock && (
        <div className="rounded-md bg-yellow-50 border border-yellow-300 px-4 py-2 text-sm text-yellow-800 font-medium">
          Live upload unavailable — showing mock data
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Event Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Predicted Attendance</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Savings (USD)</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.events.map((event, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 text-gray-800">{event.event_name}</td>
                <td className="px-4 py-2 text-gray-800">{event.predicted_attendance}</td>
                <td className="px-4 py-2 text-gray-800">${event.total_savings_usd}</td>
                <td className="px-4 py-2 text-gray-800">{event.status}</td>
              </tr>
            ))}
            <tr className="bg-green-50 font-semibold">
              <td className="px-4 py-2 text-gray-700" colSpan={1}>Summary</td>
              <td className="px-4 py-2 text-gray-700">CO2 saved: {data.summary.total_co2_saved_kg} kg</td>
              <td className="px-4 py-2 text-green-800">${data.summary.total_savings_usd}</td>
              <td className="px-4 py-2 text-gray-700">Waste: {data.summary.total_food_waste_lbs} lbs</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
