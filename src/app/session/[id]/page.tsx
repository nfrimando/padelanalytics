export default function SessionPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Session: {params.id}</h1>

      <p className="mt-2 text-gray-600">
        We will build the live annotation UI here next.
      </p>
    </div>
  );
}
