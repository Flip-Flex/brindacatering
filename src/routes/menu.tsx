import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { FinalCTA } from "@/components/site/FinalCTA";
import { itemsByCategory, MenuItem, MenuCategory, MenuSubcategory } from "@/data/menu";
import feastImage from "@/assets/premium-feast.jpg";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const Route = createFileRoute("/menu")({
  component: MenuPage,
  head: () => ({
    meta: [
      { title: "Catering Menu — Brinda Catering | Cheyyar, TN" },
      {
        name: "description",
        content:
          "Explore South Indian vegetarian, non-vegetarian, tiffin, sweets and celebration menu directions, customised to your occasion.",
      },
      { property: "og:title", content: "Catering Menu — Brinda Catering | Cheyyar, TN" },
      {
        property: "og:description",
        content:
          "South Indian menu directions customised for weddings, family functions and events.",
      },
      { property: "og:url", content: "/menu" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/menu" }],
  }),
});

function MenuPage() {
  const [firebaseItems, setFirebaseItems] = useState<MenuItem[] | null>(null);
  const [firebaseCategories, setFirebaseCategories] = useState<MenuCategory[]>([]);
  const [firebaseSubcategories, setFirebaseSubcategories] = useState<MenuSubcategory[]>([]);

  useEffect(() => {
    if (!db) return;

    const fetchData = async () => {
      if (!db) return;
      try {
        const qItems = query(collection(db, 'menuItems'), orderBy('order'));
        const snapshotItems = await getDocs(qItems);
        const dbItems = snapshotItems.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuItem);
        setFirebaseItems(dbItems);

        const qCategories = query(collection(db, 'menuCategories'), orderBy('order'));
        const snapshotCategories = await getDocs(qCategories);
        const dbCategories = snapshotCategories.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuCategory);
        setFirebaseCategories(dbCategories);

        const qSubcategories = query(collection(db, 'menuSubcategories'), orderBy('order'));
        const snapshotSubcategories = await getDocs(qSubcategories);
        const dbSubcategories = snapshotSubcategories.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuSubcategory);
        setFirebaseSubcategories(dbSubcategories);
      } catch (error) {
        console.error("Error fetching menu data:", error);
      }
    };

    fetchData();
  }, []);

  const getItemsForCategory = (categoryId: string) => {
    if (firebaseItems !== null) {
      return firebaseItems.filter(item => item.category === categoryId);
    }
    return itemsByCategory(categoryId);
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Menu",
            "name": "Brinda Catering Catering Menu",
            "description": "Authentic South Indian catering menus for events.",
            "url": "https://brindacaterers.com/menu",
            "mainEntityOfPage": "https://brindacaterers.com/menu"
          })
        }}
      />
      <PageHero
        eyebrow="Menu"
        title="A Taste of South Indian Tradition"
        image={feastImage}
        alt="Traditional South Indian vegetarian feast served on a banana leaf"
      />

      <section className="bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="space-y-12">
            {firebaseCategories.map((category, index) => {
              const items = getItemsForCategory(category.id);
              return (
                <section
                  key={category.id}
                  id={category.id}
                  aria-labelledby={`${category.id}-title`}
                  className={`scroll-mt-24 p-8 sm:p-12 rounded-[2.5rem] border-b-4 border-slate-200/50 ${index % 2 === 0 ? 'bg-background/50' : 'bg-muted/30/50'}`}
                >
                  <Reveal className="mb-12">
                    <h2
                      id={`${category.id}-title`}
                      className="font-display text-4xl sm:text-5xl"
                    >
                      {category.name}
                    </h2>
                    <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                      {category.description}
                    </p>
                  </Reveal>

                  
                  {(() => {
                    const subcats = firebaseSubcategories.filter(s => s.categoryId === category.id).sort((a,b) => (a.order??0) - (b.order??0));
                    const generalItems = items.filter(i => !i.subcategoryId);

                    const renderItemsGrid = (gridItems: MenuItem[]) => (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {gridItems.map((item, itemIndex) => {
                          const displayImage = item.image?.startsWith('/src/assets/')
                            ? item.image.replace('/src/assets/', '/assets/')
                            : item.image;
                            
                          return (
                          <Reveal
                            key={item.id}
                            delay={(itemIndex % 4) * 80}
                            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md"
                          >
                            {displayImage ? (
                              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                <img
                                  src={displayImage}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="relative aspect-[4/3] overflow-hidden bg-muted/30 flex flex-col items-center justify-center border-b border-border/50">
                                <span className="text-sm font-medium text-muted-foreground/60">No Image Available</span>
                              </div>
                            )}
                            <div className="flex flex-1 flex-col p-6">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-display text-xl leading-tight text-foreground">{item.name}</h3>
                                {item.price ? (
                                  <span className="shrink-0 text-sm font-medium text-primary">{item.price}</span>
                                ) : null}
                              </div>
                              
                              {item.tags?.length ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {item.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-sm bg-secondary/80 px-2.5 py-1 text-xs uppercase tracking-wider text-secondary-foreground"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              
                              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </Reveal>
                          );
                        })}
                      </div>
                    );

                    return (
                      <>
                        {subcats.map(subcat => {
                          const subcatItems = items.filter(i => i.subcategoryId === subcat.id);
                          if (!subcatItems.length) return null;
                          return (
                            <div key={subcat.id} className="mb-16">
                              <div className="flex items-center mb-8 mt-4">
                                <h3 className="font-display text-3xl sm:text-4xl text-primary border-b-2 border-primary/20 pb-2 inline-block pr-8">{subcat.name}</h3>
                              </div>
                              {renderItemsGrid(subcatItems)}
                            </div>
                          );
                        })}

                        {generalItems.length > 0 && (
                          <div className="mb-12 mt-8">
                            {subcats.length > 0 && (
                              <div className="flex items-center mb-8 mt-4">
                                <h3 className="font-display text-2xl sm:text-3xl text-muted-foreground border-b-2 border-border pb-2 inline-block pr-8">General Items</h3>
                              </div>
                            )}
                            {renderItemsGrid(generalItems)}
                          </div>
                        )}

                        {items.length === 0 && (
                          <p className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
                            Dishes for this category will be listed once supplied.
                          </p>
                        )}
                      </>
                    );
                  })()}

                </section>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCTA 
        title="Need a Menu for Your Event?"
        description="Whether you're planning an intimate gathering or a grand wedding, we can shape a custom catering package around your unique requirements."
        primaryCtaLabel="Book a Free Consultation"
      />
    </>
  );
}
