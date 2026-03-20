import { useParams } from 'react-router-dom'
import { DocumentLicenseDetail } from './components/DocumentLicenseDetail'

export const DocumentLicenseDetailPage = () => {
  const { id } = useParams()

  return <DocumentLicenseDetail id={id} />
}
