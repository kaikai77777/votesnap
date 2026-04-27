// Redirects to the canonical opengraph-image route
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  return Response.redirect(`${new URL(req.url).origin}/result/${id}/opengraph-image`)
}
