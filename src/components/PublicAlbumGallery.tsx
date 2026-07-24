import { photoImageUrl } from "./PhotoCard";
import classes from "./PublicAlbumGallery.module.css";

type PublicGalleryPhoto = {
  readonly id: string;
  readonly caption: string | null;
  readonly alt: string | null;
  readonly storageKey: string;
  readonly thumbnailKey: string | null;
  readonly width: number;
  readonly height: number;
};

type PublicAlbumGalleryProps = {
  readonly title: string | null;
  readonly description: string | null;
  readonly photos: readonly PublicGalleryPhoto[];
};

export const PublicAlbumGallery = ({ title, description, photos }: PublicAlbumGalleryProps) => (
  <>
    <div className={classes.gallery}>
      {photos.map((p) => (
        <a
          key={p.id}
          className={classes.item}
          href={photoImageUrl(p.storageKey)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={photoImageUrl(p.thumbnailKey ?? p.storageKey)}
            alt={p.alt ?? p.caption ?? ""}
            loading="lazy"
            style={{ aspectRatio: `${p.width} / ${p.height}` }}
          />
        </a>
      ))}
    </div>
    <div className={classes.overlay}>
      <div className={classes.overlayTitle}>{title ?? "(無題)"}</div>
      {description && <div className={classes.overlayDescription}>{description}</div>}
    </div>
  </>
);
