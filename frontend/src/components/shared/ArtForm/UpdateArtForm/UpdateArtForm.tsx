import ArtForm from '../ArtForm';
import type { Art } from '../../../../api/arts/main.api';
const UpdateArtForm = ({ art }: { art: Art }) => <ArtForm art={art} />;
export default UpdateArtForm;
