import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error(
      "Validation Fault: useCarousel hooks must execute within an active <Carousel /> provider envelope.",
    );
  }
  return context;
}

/**
 * GroUp Academy: Sequential Structural Media Browsing HUD (Carousel)
 * Hardened responsive carousel engine built over Embla UI, ensuring self-clearing event listeners and fully compliant focus paths.
 * Version: Launch Candidate · Phase Z0 Lifecycle & Accessibility Hardened
 */
const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }, ref) => {
    const isMountedRef = React.useRef<boolean>(true);

    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins,
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    // Track active mounting frames to insulate async callbacks from memory drops
    React.useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const onSelect = React.useCallback((emblaApi: CarouselApi) => {
      if (!emblaApi || !isMountedRef.current) return;
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) return;
      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) return;

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      // Phase 1: Explicitly drop ALL active background listeners on unmount passes to block memory leaks
      return () => {
        if (api) {
          api.off("reInit", onSelect);
          api.off("select", onSelect);
        }
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          opts,
          orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          role="region"
          aria-roledescription="Carousel viewport array"
          onKeyDownCapture={handleKeyDown}
          className={cn("relative w-full group/carousel select-none antialiased transform-gpu", className)}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel_Core_Root_Node";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="w-full h-full overflow-hidden select-none block">
        <div
          ref={ref}
          className={cn(
            "flex w-full h-full min-w-0 border-none p-0 bg-transparent",
            orientation === "horizontal" ? "gap-4 sm:gap-5" : "flex-col gap-4 sm:gap-5",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = "Carousel_Core_Content_Node";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="Carousel slide cell"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full transition-transform duration-300 select-none block h-full",
          className,
        )}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = "Carousel_Core_Item_Node";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        data-disabled={!canScrollPrev}
        className={cn(
          "absolute h-8 w-8 rounded-full border border-border/40 bg-background/40 backdrop-blur-md text-foreground hidden md:flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-background/80 focus-visible:opacity-100 data-[disabled=true]:pointer-events-none data-[disabled=true]:invisible",
          orientation === "horizontal"
            ? "left-2.5 top-1/2 -translate-y-1/2"
            : "top-2.5 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        {...props}
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        <span className="sr-only">Shift carousel structural frame back to prior asset item index</span>
      </Button>
    );
  },
);
CarouselPrevious.displayName = "Carousel_Core_Previous_Trigger_Node";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        disabled={!canScrollNext}
        onClick={scrollNext}
        data-disabled={!canScrollNext}
        className={cn(
          "absolute h-8 w-8 rounded-full border border-border/40 bg-background/40 backdrop-blur-md text-foreground hidden md:flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-background/80 focus-visible:opacity-100 data-[disabled=true]:pointer-events-none data-[disabled=true]:invisible",
          orientation === "horizontal"
            ? "right-2.5 top-1/2 -translate-y-1/2"
            : "bottom-2.5 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        {...props}
      >
        <ChevronRight className="h-4 w-4 stroke-[2.5]" />
        <span className="sr-only">Shift carousel structural frame forward to proceeding asset item index</span>
      </Button>
    );
  },
);
CarouselNext.displayName = "Carousel_Core_Next_Trigger_Node";

export { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
