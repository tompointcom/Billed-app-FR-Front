/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import Bills from "../containers/Bills.js"
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import router from "../app/Router.js"
import mockStore from "../__mocks__/store.js";

jest.mock("../app/store", () => ({
    bills: () => ({
      list: () => Promise.resolve([
        {
          id: "1",
          date: "2021-12-11",
          amount: 100,
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          fileName: "facture.jpg",
          status: "pending"
        }
      ])
    })
  }));


describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
            Object.defineProperty(window, 'localStorage', {value: localStorageMock})
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.Bills)
            await waitFor(() => screen.getByTestId('icon-window'))
            const windowIcon = screen.getByTestId('icon-window')
            expect(windowIcon.classList.contains('active-icon')).toBe(true)
        })

        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({ data: bills })
            const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
            const antiChrono = (a, b) => ((a < b) ? 1 : -1)
            const datesSorted = [...dates].sort(antiChrono)
            expect(dates).toEqual(datesSorted)
        })
    })
    describe("When I click on an icon-eye", () => {
        beforeEach(() => {

            global.$ = jest.fn((selector) => ({
                width: jest.fn(() => 800),
                modal: jest.fn(),
                find: jest.fn(() => ({
                    html: jest.fn()
                })),
                click: jest.fn()
            }))
        })

        test("Then a modal should open with the bill image if fileName is not 'null'", () => {
            document.body.innerHTML = `
            <div id="modaleFile" class="modal">
                <div class="modal-body"></div>
            </div>
            <div data-testid="icon-eye" data-bill-url="https://test.com/bill.jpg" data-file-name="test.jpg"></div>
            <div data-testid="icon-eye-null" data-bill-url="https://test.com/bill.jpg" data-file-name="null"></div>
        `

            const onNavigate = jest.fn()
            const bills = new Bills({
                document: document,
                onNavigate: onNavigate,
                store: null,
                localStorage: localStorageMock
            })

            const iconEye = screen.getByTestId('icon-eye')
            const iconEyeNull = screen.getByTestId('icon-eye-null')
            const handleClickIconEyeSpy = jest.spyOn(bills, 'handleClickIconEye')

            bills.handleClickIconEye(iconEye)
            expect(handleClickIconEyeSpy).toHaveBeenCalledWith(iconEye)

            bills.handleClickIconEye(iconEyeNull)
            expect(handleClickIconEyeSpy).toHaveBeenCalledWith(iconEyeNull)
        })

        test("Then handleClickIconEye should be called with the correct icon", () => {
            document.body.innerHTML = `
            <div data-testid="icon-eye" data-bill-url="https://test.com/bill.jpg" data-file-name="test.jpg"></div>
        `

            const onNavigate = jest.fn()
            const bills = new Bills({
                document: document,
                onNavigate: onNavigate,
                store: null,
                localStorage: localStorageMock
            })

            const iconEye = screen.getByTestId('icon-eye')
            const handleClickIconEyeSpy = jest.spyOn(bills, 'handleClickIconEye')

            iconEye.click()

            expect(handleClickIconEyeSpy).toHaveBeenCalledWith(iconEye)
        })
    })

    describe("When I click on the 'Nouvelle note de frais' button", () => {
        test("Then handleClickNewBill should be called", () => {

            document.body.innerHTML = `
            <div>
                <button data-testid="btn-new-bill">Nouvelle note de frais</button>
            </div>
        `


            const onNavigate = jest.fn()


            const bills = new Bills({
                document: document,
                onNavigate: onNavigate,
                store: null,
                localStorage: localStorageMock
            })


            const buttonNewBill = screen.getByTestId('btn-new-bill')
            buttonNewBill.click()


            expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
        })
    })
    describe("When I call getBills", () => {
        test("Then it should return formatted bills", async () => {
            const mockBills = [
                { date: "2021-04-01", status: "pending", type: "restaurant", amount: 50 },
                { date: "2021-03-01", status: "accepted", type: "transport", amount: 20 }
            ]

            const listMock = jest.fn(() => Promise.resolve(mockBills))
            const store = {
                bills: jest.fn(() => ({
                    list: listMock
                }))
            }

            const bills = new Bills({
                document: document,
                onNavigate: jest.fn(),
                store: store,
                localStorage: localStorageMock
            })

            const result = await bills.getBills()

            console.log("Formatted bills:", result)

            expect(store.bills).toHaveBeenCalled()
            expect(listMock).toHaveBeenCalled()

            expect(result).toEqual([
                {
                    date: "1 Avr. 21",
                    status: "En attente",
                    type: "restaurant",
                    amount: 50
                },
                {
                    date: "1 Mar. 21",
                    status: "Accepté",
                    type: "transport",
                    amount: 20
                }
            ])
        })
    })
})

describe("Given I am a user connected as employee", () => {
    describe("When I navigate to Bills.js", () => {
        test("fetches bills from mock API GET", async () => {
            // Setup mock API response
            const mockBills = [{
                id: '1',
                date: '2021-04-01',
                status: 'En attente',
                type: 'Restaurant',
                amount: 100,
                commentAdmin: 'ok',
                email: 'a@a'
            }];
        
            // Setup mock store
            const store = {
                bills: jest.fn(() => ({
                    list: jest.fn().mockResolvedValue(mockBills)
                }))
            };
        
            // Setup DOM
            localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
            document.body.innerHTML = '<div id="root"></div>';
        
            // ACT
            const bills = new Bills({
                document,
                onNavigate: jest.fn(),
                store,
                localStorage: window.localStorage
            });
        
            document.body.innerHTML = BillsUI({ data: await bills.getBills() });
        
            // ASSERT
            await waitFor(() => {
                expect(screen.getByText('Mes notes de frais')).toBeTruthy();
                expect(store.bills).toHaveBeenCalled();
            });
        });


        describe("When an error occurs on API", () => {
            test("fetches bills from an API and fails with 404 message error", async () => {
                // ARRANGE
                // Setup mock store with 404 error
                const store = {
                    bills: jest.fn(() => ({
                        list: jest.fn().mockRejectedValue(new Error("Erreur 404"))
                    }))
                };

                // Setup DOM
                localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
                document.body.innerHTML = '<div id="root"></div>';

                // ACT
                const bills = new Bills({
                    document,
                    onNavigate: jest.fn(),
                    store,
                    localStorage: window.localStorage
                });

                // Render UI with error
                document.body.innerHTML = BillsUI({ error: "Erreur 404" });

                // ASSERT
                await waitFor(() => {
                    const errorMessage = screen.queryByText((content) => {
                        return content.includes("Erreur 404");
                    });
                    expect(errorMessage).toBeTruthy();
                });
            });

            test("fetches messages from an API and fails with 500 message error", async () => {
                // ARRANGE
                // Setup mock store with 500 error
                const store = {
                    bills: jest.fn(() => ({
                        list: jest.fn().mockRejectedValue(new Error("Erreur 500"))
                    }))
                };

                // Setup DOM
                localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
                document.body.innerHTML = '<div id="root"></div>';

                // ACT
                const bills = new Bills({
                    document,
                    onNavigate: jest.fn(),
                    store,
                    localStorage: window.localStorage
                });

                // Render UI with error
                document.body.innerHTML = BillsUI({ error: "Erreur 500" });

                // ASSERT
                await waitFor(() => {
                    const errorMessage = screen.queryByText((content) => {
                        return content.includes("Erreur 500");
                    });
                    expect(errorMessage).toBeTruthy();
                });
            });
        });
    });
});
