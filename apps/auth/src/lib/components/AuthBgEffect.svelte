<div class="auth-background" aria-hidden="true">
  <div class="auth-background__grid"></div>
  <div class="auth-background__orbit auth-background__orbit--left"></div>
  <div class="auth-background__orbit auth-background__orbit--right"></div>
</div>

<style>
  .auth-background {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse at 14% 18%,
        color-mix(in srgb, var(--color-primary-7) 18%, transparent),
        transparent 42%
      ),
      radial-gradient(
        ellipse at 88% 82%,
        color-mix(in srgb, var(--color-violet-7) 15%, transparent),
        transparent 40%
      );
  }

  .auth-background__grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(
        color-mix(in srgb, var(--color-primary-11) 7%, transparent) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--color-primary-11) 7%, transparent) 1px,
        transparent 1px
      );
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, transparent 15%, black 100%);
  }

  .auth-background__orbit {
    position: absolute;
    width: clamp(20rem, 42vw, 40rem);
    aspect-ratio: 1;
    border: 1px solid color-mix(in srgb, var(--color-primary-9) 17%, transparent);
    border-radius: 50%;
    box-shadow:
      0 0 0 3rem color-mix(in srgb, var(--color-primary-9) 3%, transparent),
      0 0 0 6rem color-mix(in srgb, var(--color-primary-9) 2%, transparent);
  }

  .auth-background__orbit--left {
    top: -16rem;
    left: -12rem;
  }

  .auth-background__orbit--right {
    right: -14rem;
    bottom: -18rem;
    border-color: color-mix(in srgb, var(--color-violet-9) 18%, transparent);
  }
</style>
