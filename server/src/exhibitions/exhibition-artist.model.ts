import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Exhibition } from "./exhibition.model";
import { ArtistProfile } from "../artists/artist.model";
import { User } from "../users/users.model";

@Table({ tableName: 'exhibition_artists', createdAt: false, updatedAt: false })
export class ExhibitionArtist extends Model<ExhibitionArtist> {
    @ForeignKey(() => Exhibition)
    @Column({ type: DataType.INTEGER, allowNull: false })
    exhibition_id: number;

    @ForeignKey(() => ArtistProfile)
    @Column({ type: DataType.INTEGER, allowNull: false })
    artist_id: number;

    @BelongsTo(() => Exhibition)
    exhibition: Exhibition;

    @BelongsTo(() => ArtistProfile)
    artistProfile: ArtistProfile;
}